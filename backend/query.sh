#!/bin/bash

# Hotel Management SQL Terminal Script
# Usage: ./query.sh "SELECT * FROM Customers"

API_URL="${API_URL:-http://localhost:4000}"
TOKEN="${AUTH_TOKEN:-${TOKEN:-}}"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

if [ -z "$1" ]; then
    echo -e "${RED}Error: Please provide a SQL query${NC}"
    echo "Usage: ./query.sh \"SELECT * FROM Customers\""
    echo ""
    echo "Examples:"
    echo "  ./query.sh \"SELECT * FROM Orders LIMIT 10\""
    echo "  ./query.sh \"SELECT * FROM MenuItems\""
    echo "  ./query.sh \"SELECT COUNT(*) as total FROM Customers\""
    exit 1
fi

QUERY="$1"

echo -e "${BLUE}Executing query...${NC}"
echo "Query: $QUERY"
echo ""

# Build curl command
if [ -n "$TOKEN" ]; then
    RESPONSE=$(curl -s -X POST "${API_URL}/api/terminal/query" \
        -H 'Content-Type: application/json' \
        -H "x-auth-token: $TOKEN" \
        -d "{\"query\": \"$QUERY\"}")
else
    RESPONSE=$(curl -s -X POST "${API_URL}/api/terminal/query" \
        -H 'Content-Type: application/json' \
        -d "{\"query\": \"$QUERY\"}")
fi

# Check if jq is installed for pretty printing
if command -v jq &> /dev/null; then
    echo "$RESPONSE" | jq .
else
    echo "$RESPONSE"
fi

# Check for success
if echo "$RESPONSE" | grep -q '"success":true'; then
    echo ""
    echo -e "${GREEN}✓ Query executed successfully${NC}"
    echo -e "${GREEN}✓ Results are now visible in the frontend Terminal page${NC}"
else
    echo ""
    echo -e "${RED}✗ Query failed${NC}"
fi
