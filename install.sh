#!/bin/bash

# ============================================================
# learn { } with AI — Installer
# ============================================================

set -e

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATA_DIR="$REPO_DIR/data"

# Colors
GREEN='\033[0;32m'
ORANGE='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo ""
echo "=============================================="
echo "  learn { } with AI — Installer"
echo "=============================================="
echo ""

# ── Check Node.js ──────────────────────────────────────────
if ! command -v node &> /dev/null; then
  echo -e "${RED}Error: Node.js is not installed.${NC}"
  echo "Please install Node.js v18 or higher from https://nodejs.org"
  echo "Or use NVM: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash"
  exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo -e "${RED}Error: Node.js v18 or higher is required. You have $(node -v).${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Node.js $(node -v) detected${NC}"
echo ""

# ── Select install type ────────────────────────────────────
echo "Select your install type:"
echo ""
echo "  1) No LLM       — I'll configure one later in the app"
echo "  2) Local LLM    — Install Mistral 7B via Ollama (free, ~5GB, no API key needed)"
echo "  3) API LLM      — Connect to Claude, OpenAI, Groq, Mistral, or custom endpoint"
echo ""
read -p "Enter choice (1-3): " INSTALL_TYPE
echo ""

# ── Install Node dependencies ──────────────────────────────
echo "Installing dependencies..."
cd "$REPO_DIR"
npm install --silent
npm approve-scripts better-sqlite3 2>/dev/null || true
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# ── Copy env file ──────────────────────────────────────────
if [ ! -f "$REPO_DIR/.env.local" ]; then
  if [ -f "$REPO_DIR/.env.local.example" ]; then
    cp "$REPO_DIR/.env.local.example" "$REPO_DIR/.env.local"
  else
    touch "$REPO_DIR/.env.local"
  fi
fi

# ── Create data directory ──────────────────────────────────
mkdir -p "$DATA_DIR"

# ── Path 1: No LLM ────────────────────────────────────────
if [ "$INSTALL_TYPE" = "1" ]; then
  echo "Skipping LLM configuration."
  echo "You can configure an LLM later at http://localhost:3000/settings/llm"
  echo ""

# ── Path 2: Local LLM (Mistral 7B via Ollama) ─────────────
elif [ "$INSTALL_TYPE" = "2" ]; then

  # Install Ollama if not present
  if ! command -v ollama &> /dev/null; then
    echo "Installing Ollama..."
    curl -fsSL https://ollama.ai/install.sh | sh
    echo -e "${GREEN}✓ Ollama installed${NC}"
  else
    echo -e "${GREEN}✓ Ollama already installed${NC}"
  fi
  echo ""

  # Pull Mistral
  echo "Pulling Mistral 7B — this may take several minutes (~5GB download)..."
  ollama pull mistral
  echo -e "${GREEN}✓ Mistral 7B ready${NC}"
  echo ""

  # Seed llm-configs.json
  # TODO: LOCAL_LLM_UI
  # Verify that the /settings/llm UI allows users to add a local Ollama LLM
  # through the same "Add LLM" modal as cloud API providers.
  # The modal currently has Ollama as a provider option with base URL
  # pre-filled to http://localhost:11434/v1 and API key marked as optional.
  # Test end-to-end: install Ollama → pull a model → add via UI → test connection.
  # If the flow is unclear, add a dedicated "Add Local LLM" shortcut or
  # a helper tooltip explaining that local LLMs use Ollama.
  cat > "$DATA_DIR/llm-configs.json" << 'EOF'
{
  "globalTimeoutMs": 60000,
  "activeIndex": 0,
  "configs": [
    {
      "index": 0,
      "id": "ollama-mistral-7b",
      "label": "Mistral 7B (local)",
      "provider": "Ollama",
      "family": "Mistral",
      "version": "7B",
      "baseUrl": "http://localhost:11434/v1",
      "apiKey": "",
      "model": "mistral",
      "timeoutMs": 60000,
      "status": "untested"
    }
  ]
}
EOF
  echo -e "${GREEN}✓ Mistral 7B configured as default LLM${NC}"
  echo ""

# ── Path 3: API LLM ───────────────────────────────────────
elif [ "$INSTALL_TYPE" = "3" ]; then

  echo "Select your LLM provider:"
  echo ""
  echo "  1) Anthropic  (Claude)"
  echo "  2) OpenAI     (GPT)"
  echo "  3) Groq"
  echo "  4) Mistral API"
  echo "  5) Custom endpoint"
  echo ""
  read -p "Enter choice (1-5): " PROVIDER_CHOICE
  echo ""

  case $PROVIDER_CHOICE in
    1)
      PROVIDER="Anthropic"
      BASE_URL="https://api.anthropic.com"
      DEFAULT_MODEL="claude-sonnet-4-6"
      FAMILY="Sonnet"
      VERSION="4.6"
      LABEL="Claude Sonnet 4.6"
      ;;
    2)
      PROVIDER="OpenAI"
      BASE_URL="https://api.openai.com/v1"
      DEFAULT_MODEL="gpt-4o"
      FAMILY="GPT"
      VERSION="4o"
      LABEL="GPT-4o"
      ;;
    3)
      PROVIDER="Groq"
      BASE_URL="https://api.groq.com/openai/v1"
      DEFAULT_MODEL="llama-3.1-70b-versatile"
      FAMILY="Llama"
      VERSION="3.1-70b"
      LABEL="Llama 3.1 70B (Groq)"
      ;;
    4)
      PROVIDER="Mistral"
      BASE_URL="https://api.mistral.ai/v1"
      DEFAULT_MODEL="mistral-large-latest"
      FAMILY="Mistral"
      VERSION="Large"
      LABEL="Mistral Large"
      ;;
    5)
      PROVIDER="Custom"
      read -p "Enter base URL: " BASE_URL
      read -p "Enter model name: " DEFAULT_MODEL
      read -p "Enter label (e.g. My Custom LLM): " LABEL
      FAMILY="Custom"
      VERSION="1.0"
      ;;
    *)
      echo -e "${RED}Invalid choice.${NC}"
      exit 1
      ;;
  esac

  # Prompt for API key
  echo ""
  read -p "Enter your $PROVIDER API key (leave blank for none): " API_KEY
  echo ""

  # For Anthropic, also write to .env.local
  if [ "$PROVIDER_CHOICE" = "1" ] && [ -n "$API_KEY" ]; then
    sed -i "s/sk-ant-your-key-here/$API_KEY/" "$REPO_DIR/.env.local"
    echo -e "${GREEN}✓ API key written to .env.local${NC}"
  fi

  # Generate a simple ID
  CONFIG_ID="${PROVIDER,,}-$(date +%s)"

  # Seed llm-configs.json
  cat > "$DATA_DIR/llm-configs.json" << EOF
{
  "globalTimeoutMs": 30000,
  "activeIndex": 0,
  "configs": [
    {
      "index": 0,
      "id": "$CONFIG_ID",
      "label": "$LABEL",
      "provider": "$PROVIDER",
      "family": "$FAMILY",
      "version": "$VERSION",
      "baseUrl": "$BASE_URL",
      "apiKey": "$API_KEY",
      "model": "$DEFAULT_MODEL",
      "timeoutMs": null,
      "status": "untested"
    }
  ]
}
EOF
  echo -e "${GREEN}✓ $LABEL configured as default LLM${NC}"
  echo ""

else
  echo -e "${RED}Invalid choice.${NC}"
  exit 1
fi

# ── Build the app ──────────────────────────────────────────
echo "Building app..."
npm run build
echo -e "${GREEN}✓ Build complete${NC}"
echo ""

# ── Done ──────────────────────────────────────────────────
echo "=============================================="
echo -e "  ${GREEN}Installation complete!${NC}"
echo "=============================================="
echo ""
echo "To start the app:"
echo ""
echo "  npm run learn"
echo ""
echo "Then open http://localhost:3000 in your browser."
echo ""
echo "To add or change LLM providers:"
echo "  http://localhost:3000/settings/llm"
echo ""