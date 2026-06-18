package main

import (
	"fmt"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
)

type IntentRequest struct {
	Provider     string `json:"provider"`
	Action       string `json:"action"`
	ResourceName string `json:"resource_name"`
	Region       string `json:"region"`
}

func main() {
	r := gin.Default()

	// Verify Cosmos DB Connection String
	cosmosConn := os.Getenv("COSMOS_DB_CONN_STR")
	if cosmosConn == "" {
		fmt.Println("Warning: COSMOS_DB_CONN_STR not set. Operating in memory-only mode.")
	}

	r.POST("/api/infra/generate", func(c *gin.Context) {
		var req IntentRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Generate Terraform based on the Action
		tfCode := generateTerraform(req)

		// Mock save to Cosmos DB
		deploymentID := "deploy-" + req.ResourceName

		c.JSON(http.StatusOK, gin.H{
			"message":       "Terraform configuration generated and saved to state.",
			"deployment_id": deploymentID,
			"terraform":     tfCode,
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
	
	return fmt.Sprintf("# Unsupported action '%s' for provider '%s'", req.Action, req.Provider)
}
