package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
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
	ClientID       string `json:"clientId"`
	ClientSecret   string `json:"clientSecret"`
	TenantID       string `json:"tenantId"`
	SubscriptionID string `json:"subscriptionId"`
}

// Simple JSON Database
var dbFile = "/app/data/deployments.json"
var credFile = "/app/data/credentials.json"
var dbMutex sync.Mutex

func loadDeployments() []DeploymentRecord {
	dbMutex.Lock()
	defer dbMutex.Unlock()

	var records []DeploymentRecord
	data, err := os.ReadFile(dbFile)
	if err == nil {
		json.Unmarshal(data, &records)
	}
	return records
}

func saveDeployment(record DeploymentRecord) {
	dbMutex.Lock()
	defer dbMutex.Unlock()

	os.MkdirAll("/app/data", 0755)
	
	var records []DeploymentRecord
	data, err := os.ReadFile(dbFile)
	if err == nil {
		json.Unmarshal(data, &records)
	}
	
	// Add new record at the beginning
	records = append([]DeploymentRecord{record}, records...)
	
	newData, _ := json.MarshalIndent(records, "", "  ")
	os.WriteFile(dbFile, newData, 0644)
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
	r := gin.Default()
	r.Use(corsMiddleware())

	r.POST("/api/infra/generate", func(c *gin.Context) {
		var req IntentRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Generate Terraform based on the Action
		tfCode := generateTerraform(req)

		// Create deployment ID
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

		// Save to JSON Database
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
			"message":       "Terraform configuration generated and saved to state.",
			"deployment_id": deploymentID,
		})
	})

	r.POST("/api/infra/settings", func(c *gin.Context) {
		var req SettingsRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		os.MkdirAll("/app/data", 0755)
		data, _ := json.Marshal(req)
		err := os.WriteFile(credFile, data, 0600) // Secure permissions
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save credentials"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Credentials saved securely"})
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
				// Rough heuristic based on action or resource name
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

	fmt.Printf("Infrastructure Service running on port %s\n", port)
	r.Run(":" + port)
}

func generateTerraform(req IntentRequest) string {
	if req.Provider == "azure" {
		if req.Action == "create_vm" {
			return fmt.Sprintf(`
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

resource "azurerm_linux_virtual_machine" "vm" {
  name                = "%s"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  size                = "Standard_B2s"
  admin_username      = "adminuser"
  network_interface_ids = [
    # Requires azurerm_network_interface to be created
  ]

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
`, req.ResourceName, req.Region, req.ResourceName, req.ResourceName)
		}
	}
	
	return fmt.Sprintf("# Unsupported action '%s' for provider '%s'\n# To test locally, write valid Terraform here.", req.Action, req.Provider)
}
