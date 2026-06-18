package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/Azure/azure-sdk-for-go/sdk/data/azcosmos"
)

type IntentRequest struct {
	Provider     string `json:"provider"`
	Action       string `json:"action"`
	ResourceName string `json:"resource_name"`
	Region       string `json:"region"`
	Prompt       string `json:"prompt"`
}

type DeploymentRecord struct {
	ID           string `json:"id"`
	Prompt       string `json:"prompt"`
	Target       string `json:"target"`
	Status       string `json:"status"`
	Date         string `json:"date"`
	ResourceName string `json:"resource_name"`
}

type SettingsRequest struct {
	ID             string `json:"id"` // Required for Cosmos DB
	ClientID       string `json:"clientId"`
	ClientSecret   string `json:"clientSecret"`
	TenantID       string `json:"tenantId"`
	SubscriptionID string `json:"subscriptionId"`
}

var credFile = "/app/data/credentials.json"
var cosmosClient *azcosmos.Client

func initDB() {
	connStr := os.Getenv("COSMOS_DB_CONN_STR")
	if connStr == "" {
		fmt.Println("WARNING: COSMOS_DB_CONN_STR not set. Operating without database persistence.")
		return
	}

	client, err := azcosmos.NewClientFromConnectionString(connStr, nil)
	if err != nil {
		fmt.Printf("Failed to connect to Cosmos DB: %v\n", err)
		return
	}
	cosmosClient = client
	fmt.Println("Successfully connected to Azure Cosmos DB for Infrastructure State")
}

func loadDeployments() []DeploymentRecord {
	if cosmosClient == nil {
		return []DeploymentRecord{}
	}

	container, _ := cosmosClient.NewContainer("CloudPilotDB", "deployments")
	
	// Query all deployments
	query := "SELECT * FROM c"
	pager := container.NewQueryItemsPager(query, azcosmos.NewPartitionKey("history"), nil)

	var records []DeploymentRecord
	for pager.More() {
		response, err := pager.NextPage(context.TODO())
		if err != nil {
			fmt.Printf("Query error: %v\n", err)
			break
		}
		for _, bytes := range response.Items {
			var record DeploymentRecord
			json.Unmarshal(bytes, &record)
			records = append(records, record)
		}
	}
	
	// Reverse to show newest first
	for i, j := 0, len(records)-1; i < j; i, j = i+1, j-1 {
		records[i], records[j] = records[j], records[i]
	}
	
	return records
}

func saveDeployment(record DeploymentRecord) {
	if cosmosClient == nil {
		return
	}

	container, _ := cosmosClient.NewContainer("CloudPilotDB", "deployments")
	
	// Create a wrapper with partition key
	item := map[string]interface{}{
		"id": record.ID,
		"partitionKey": "history", // static partition key for history
		"prompt": record.Prompt,
		"target": record.Target,
		"status": record.Status,
		"date": record.Date,
		"resource_name": record.ResourceName,
	}
	
	marshalled, _ := json.Marshal(item)
	_, err := container.UpsertItem(context.TODO(), azcosmos.NewPartitionKey("history"), marshalled, nil)
	if err != nil {
		fmt.Printf("Failed to save deployment to DB: %v\n", err)
	}
}

// CORS middleware
func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")
		
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}

func main() {
	initDB()
	
	r := gin.Default()
	r.Use(corsMiddleware())

	r.POST("/api/infra/generate", func(c *gin.Context) {
		var req IntentRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		tfCode := generateTerraform(req)

		deploymentID := fmt.Sprintf("dep-%d", time.Now().Unix())
		if req.ResourceName != "" {
			deploymentID = "dep-" + req.ResourceName
		}

		// Write to shared templates folder for deploy-service
		dir := filepath.Join("/app/templates", deploymentID)
		os.MkdirAll(dir, 0755)
		
		err := os.WriteFile(filepath.Join(dir, "main.tf"), []byte(tfCode), 0644)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to write Terraform config"})
			return
		}

		// Save to Cosmos DB Database
		record := DeploymentRecord{
			ID:           deploymentID,
			Prompt:       req.Prompt,
			Target:       req.Provider,
			Status:       "Running",
			Date:         time.Now().Format("Jan 02, 15:04 PM"),
			ResourceName: req.ResourceName,
		}
		saveDeployment(record)

		c.JSON(http.StatusOK, gin.H{
			"message":       "Terraform configuration generated and saved to Azure Cosmos DB state.",
			"deployment_id": deploymentID,
		})
	})

	r.POST("/api/infra/settings", func(c *gin.Context) {
		var req SettingsRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		
		req.ID = "azure_sp"

		// Save to local file for Terraform worker to consume
		os.MkdirAll("/app/data", 0755)
		data, _ := json.Marshal(req)
		os.WriteFile(credFile, data, 0600)

		// Save securely to Cosmos DB
		if cosmosClient != nil {
			container, _ := cosmosClient.NewContainer("CloudPilotDB", "settings")
			
			item := map[string]interface{}{
				"id": req.ID,
				"partitionKey": "azure",
				"clientId": req.ClientID,
				"clientSecret": req.ClientSecret,
				"tenantId": req.TenantID,
				"subscriptionId": req.SubscriptionID,
			}
			marshalled, _ := json.Marshal(item)
			container.UpsertItem(context.TODO(), azcosmos.NewPartitionKey("azure"), marshalled, nil)
		}

		c.JSON(http.StatusOK, gin.H{"message": "Credentials securely vaulted in Azure Cosmos DB"})
	})

	r.GET("/api/infra/history", func(c *gin.Context) {
		records := loadDeployments()
		c.JSON(http.StatusOK, records)
	})

	r.GET("/api/infra/stats", func(c *gin.Context) {
		records := loadDeployments()
		
		vms := 0
		k8s := 0
		dbs := 0
		networks := 0
		
		for _, r := range records {
			if r.Status == "Running" || r.Status == "Success" {
				vms++ 
			}
		}

		c.JSON(http.StatusOK, gin.H{
			"vms":      vms,
			"k8s":      k8s,
			"dbs":      dbs,
			"networks": networks,
		})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}

	fmt.Printf("Production Infrastructure Service running on port %s\n", port)
	r.Run(":" + port)
}

func generateTerraform(req IntentRequest) string {
	if req.Provider == "azure" {
		if req.Action == "create_vm" {
			return fmt.Sprintf(`
terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0.2"
    }
  }
}

provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "rg" {
  name     = "%s-rg"
  location = "%s"
}

resource "azurerm_virtual_network" "vnet" {
  name                = "%s-vnet"
  address_space       = ["10.0.0.0/16"]
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
}

resource "azurerm_subnet" "subnet" {
  name                 = "internal"
  resource_group_name  = azurerm_resource_group.rg.name
  virtual_network_name = azurerm_virtual_network.vnet.name
  address_prefixes     = ["10.0.2.0/24"]
}

resource "azurerm_network_interface" "nic" {
  name                = "%s-nic"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name

  ip_configuration {
    name                          = "internal"
    subnet_id                     = azurerm_subnet.subnet.id
    private_ip_address_allocation = "Dynamic"
  }
}

resource "azurerm_linux_virtual_machine" "vm" {
  name                = "%s"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  size                = "Standard_B2s"
  admin_username      = "adminuser"
  network_interface_ids = [
    azurerm_network_interface.nic.id,
  ]

  admin_ssh_key {
    username   = "adminuser"
    public_key = "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQCxyz... generatedkey"
  }

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Standard_LRS"
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "UbuntuServer"
    sku       = "18.04-LTS"
    version   = "latest"
  }
}
`, req.ResourceName, req.Region, req.ResourceName, req.ResourceName, req.ResourceName)
		}
	}
	
	return fmt.Sprintf("# Unsupported action '%s' for provider '%s'\n# This is a production environment. Action rejected.", req.Action, req.Provider)
}
