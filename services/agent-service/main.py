import os
import json
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from openai import AzureOpenAI
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="CloudPilot AI Agent Service")

# Setup Azure AI Foundry Client
client = AzureOpenAI(
    azure_endpoint=os.getenv("AZURE_AI_FOUNDRY_ENDPOINT", ""),
    api_key=os.getenv("AZURE_AI_FOUNDRY_API_KEY", ""),
    api_version="2024-02-15-preview"
)
MODEL_DEPLOYMENT = os.getenv("MODEL_DEPLOYMENT_NAME", "gpt-4o")

class ChatRequest(BaseModel):
    message: str
    conversation_id: str = "default"

# Define the Function Calling Tool for Azure/AWS Resource Creation
tools = [
    {
        "type": "function",
        "function": {
            "name": "generate_infrastructure",
            "description": "Generates a structured JSON configuration for cloud infrastructure based on user request.",
            "parameters": {
                "type": "object",
                "properties": {
                    "provider": {
                        "type": "string",
                        "enum": ["azure", "aws"],
                        "description": "The target cloud provider."
                    },
                    "action": {
                        "type": "string",
                        "enum": ["create_vm", "create_kubernetes", "create_vnet", "create_database", "create_storage"],
                        "description": "The primary action requested."
                    },
                    "resource_name": {
                        "type": "string",
                        "description": "Suggested name for the resource."
                    },
                    "region": {
                        "type": "string",
                        "description": "Target region (e.g., 'eastus' for Azure, 'us-east-1' for AWS)."
                    },
                    "specs": {
                        "type": "object",
                        "description": "Specific requirements like OS, Memory, Node count, etc."
                    }
                },
                "required": ["provider", "action", "resource_name", "region"]
            }
        }
    }
]

@app.post("/api/agent/chat")
async def chat_with_agent(req: ChatRequest):
    if not os.getenv("AZURE_AI_FOUNDRY_API_KEY"):
        # Fallback mock for testing without keys
        return {
            "reply": "API keys missing. Returning mock structure.",
            "intent": {
                "provider": "azure",
                "action": "create_vm",
                "resource_name": "mock-vm",
                "region": "eastus"
            }
        }

    try:
        response = client.chat.completions.create(
            model=MODEL_DEPLOYMENT,
            messages=[
                {"role": "system", "content": "You are CloudPilot AI, an expert cloud infrastructure architect. Your job is to extract exact infrastructure requirements from the user and call the generate_infrastructure tool."},
                {"role": "user", "content": req.message}
            ],
            tools=tools,
            tool_choice={"type": "function", "function": {"name": "generate_infrastructure"}}
        )
        
        message = response.choices[0].message
        if message.tool_calls:
            tool_call = message.tool_calls[0]
            arguments = json.loads(tool_call.function.arguments)
            
            # Here we would normally forward this 'arguments' JSON to the Infrastructure Service
            return {
                "reply": f"I have processed your request to {arguments.get('action')} in {arguments.get('provider')}.",
                "intent": arguments
            }
        else:
            return {
                "reply": message.content,
                "intent": None
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
