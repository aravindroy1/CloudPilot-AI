# CloudPilot AI: Deployment & Integration Guide

This guide covers everything you need to do to deploy the `docker-compose.yml` architecture onto a Virtual Machine, expose it to the internet, and connect the Azure AI Foundry model.

## Prerequisites
1. **A Virtual Machine**: Ubuntu 22.04 LTS or similar Linux VM is highly recommended. You can provision one on Azure, AWS, or use an on-premise server.
2. **Domain Name (Optional but Recommended)**: To point a URL to your VM's public IP.
3. **Azure Account**: For the Azure AI Foundry model.

---

## Part 1: VM Setup & Docker Compose Deployment

### 1. SSH into your VM
Connect to your newly provisioned Virtual Machine:
```bash
ssh user@<YOUR_VM_PUBLIC_IP>
```

### 2. Install Docker & Docker Compose
Run the following commands to install the required Docker engine:
```bash
# Update packages
sudo apt-get update

# Install Docker
sudo apt-get install -y docker.io docker-compose

# Add your user to the docker group (so you don't need sudo for docker commands)
sudo usermod -aG docker $USER
newgrp docker
```

### 3. Clone / Transfer the Repository
Transfer the `cloudpilot-ai` folder (which I just scaffolded) to your VM. If it's on GitHub, clone it:
```bash
git clone https://github.com/your-org/cloudpilot-ai.git
cd cloudpilot-ai
```

### 4. Configure Environment Variables
Copy the `.env.example` file to create your `.env` file:
```bash
cp .env.example .env
```
Open `.env` using a text editor (like `nano .env`) and fill in the Azure and AWS credentials. (Leave the AI Foundry ones blank for now until we get them in Part 3).

### 5. Spin Up the Platform
Run the docker-compose command in detached mode:
```bash
docker-compose up -d --build
```
> [!NOTE]
> The first time you run this, it will take several minutes as it downloads base images for Node, Python, Golang, and the Cosmos DB Emulator.

Verify everything is running:
```bash
docker-compose ps
```

---

## Part 2: Exposing the Application

Currently, the Nginx API Gateway is listening on port `8080` and the Next.js Frontend is on port `3000`.

### 1. Open VM Firewall Ports
In your cloud provider console (e.g., Azure Network Security Group or AWS Security Group), open the following inbound ports:
- **Port 80 (HTTP)**
- **Port 443 (HTTPS)**
- **Port 3000** (If you want to access the frontend directly before setting up a reverse proxy)

### 2. Set Up a Production Reverse Proxy (Optional but Recommended)
To serve the frontend on port 80/443 and the API on `/api`, you should install Nginx directly on the VM (outside of Docker) or use a tool like **Caddy** which provisions SSL automatically.

**Using Caddy (Easiest Method):**
```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

Edit the Caddyfile (`sudo nano /etc/caddy/Caddyfile`):
```text
cloudpilot.yourdomain.com {
    reverse_proxy /api/* localhost:8080
    reverse_proxy /* localhost:3000
}
```
Restart Caddy: `sudo systemctl restart caddy`.

---

## Part 3: Connecting Azure AI Foundry

The AI Agent Service is the brain of CloudPilot AI, responsible for parsing natural language into structured Terraform schemas. Here is how to wire it up.

### 1. Create the Azure AI Foundry Resource
1. Log into the [Azure Portal](https://portal.azure.com/).
2. Search for **Azure AI Studio** or **Azure OpenAI**.
3. Create a new resource. Select your region (e.g., East US) and pricing tier.
4. Once deployed, navigate to the **Azure AI Studio**.

### 2. Deploy a Model
1. In the AI Studio, go to the **Deployments** tab.
2. Click **Create new deployment**.
3. Select a model capable of strong reasoning and Function Calling.
   > [!IMPORTANT]
   > We highly recommend deploying **`gpt-4o`** or **`gpt-4-turbo`** as they excel at generating strict JSON objects and understanding complex infrastructure prompts.
4. Name your deployment (e.g., `cloudpilot-gpt4o`).

### 3. Get Credentials
1. Go to the **Keys and Endpoint** section of your Azure OpenAI resource.
2. Copy `KEY 1` (This is your API Key).
3. Copy the `Endpoint` (e.g., `https://my-cloudpilot-ai.openai.azure.com/`).

### 4. Update the `.env` File
SSH back into your VM, open the `.env` file inside the `cloudpilot-ai` directory, and paste the values:

```env
AZURE_AI_FOUNDRY_ENDPOINT=https://my-cloudpilot-ai.openai.azure.com/
AZURE_AI_FOUNDRY_API_KEY=your_copied_key_here
MODEL_DEPLOYMENT_NAME=cloudpilot-gpt4o
```

### 5. Restart the Agent Service
To apply the new environment variables, restart the agent service container:
```bash
docker-compose restart agent-service
```

### 6. Verify Functionality
You can test the AI Agent Service by sending a POST request to the API Gateway:
```bash
curl -X POST http://localhost:8080/api/agent/chat \
-H "Content-Type: application/json" \
-d '{"message": "Create an Ubuntu VM in Azure"}'
```
You should receive a structured JSON response containing the extracted intents (`action: create_vm`, `provider: azure`, `os: ubuntu`).

---

## What's Next?
Now that the architecture blueprint is complete, and your deployment strategy is mapped out, the next step in development is to:
1. Initialize the Next.js frontend code inside the `frontend/` folder.
2. Write the Python code for the AI Agent Service using LangChain or AutoGen to interact with the Foundry API.
3. Write the Go code for the Infrastructure Service to map the AI's JSON output to Terraform templates.
