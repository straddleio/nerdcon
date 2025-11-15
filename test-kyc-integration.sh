#!/bin/bash

# KYC Integration Test Script
# Tests the full flow of creating a KYC customer and verifying data

set -e  # Exit on error

echo "🧪 Starting KYC Integration Test..."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_URL="${API_URL:-http://localhost:3000}"
CUSTOMER_DATA='{
  "first_name": "Jane",
  "last_name": "Doe",
  "email": "jane.doe@example.com",
  "phone": "+12025551234",
  "address": {
    "address1": "1600 Pennsylvania Avenue NW",
    "city": "Washington",
    "state": "DC",
    "zip": "20500"
  },
  "compliance_profile": {
    "ssn": "123-45-6789",
    "dob": "1990-01-15"
  }
}'

echo -e "${YELLOW}Test 1: Create KYC Customer${NC}"
RESPONSE=$(curl -s -X POST "$API_URL/api/customers" \
  -H "Content-Type: application/json" \
  -d "$CUSTOMER_DATA")

# Extract customer ID
CUSTOMER_ID=$(echo "$RESPONSE" | jq -r '.id')

if [ "$CUSTOMER_ID" != "null" ] && [ -n "$CUSTOMER_ID" ]; then
  echo -e "${GREEN}✅ Customer created with ID: $CUSTOMER_ID${NC}"
else
  echo -e "${RED}❌ Failed to create customer${NC}"
  echo "$RESPONSE" | jq '.'
  exit 1
fi

# Verify customer data
echo -e "\n${YELLOW}Test 2: Verify Customer Data${NC}"

FIRST_NAME=$(echo "$RESPONSE" | jq -r '.first_name')
LAST_NAME=$(echo "$RESPONSE" | jq -r '.last_name')
ADDRESS1=$(echo "$RESPONSE" | jq -r '.address.address1')
SSN=$(echo "$RESPONSE" | jq -r '.compliance_profile.ssn')
DOB=$(echo "$RESPONSE" | jq -r '.compliance_profile.dob')

if [ "$FIRST_NAME" = "Jane" ] && [ "$LAST_NAME" = "Doe" ]; then
  echo -e "${GREEN}✅ Name verified: $FIRST_NAME $LAST_NAME${NC}"
else
  echo -e "${RED}❌ Name mismatch${NC}"
  exit 1
fi

if [ "$ADDRESS1" = "1600 Pennsylvania Avenue NW" ]; then
  echo -e "${GREEN}✅ Address verified${NC}"
else
  echo -e "${RED}❌ Address mismatch${NC}"
  exit 1
fi

# Verify review data
echo -e "\n${YELLOW}Test 3: Verify KYC Review Data${NC}"

KYC_DECISION=$(echo "$RESPONSE" | jq -r '.review.kyc.decision')
if [ "$KYC_DECISION" != "null" ] && [ -n "$KYC_DECISION" ]; then
  echo -e "${GREEN}✅ KYC decision received: $KYC_DECISION${NC}"
else
  echo -e "${YELLOW}⚠️  No KYC decision (may be pending)${NC}"
fi

# Check for watchlist data
WATCHLIST_MATCHES=$(echo "$RESPONSE" | jq -r '.review.address_watchlist.matches | length')
if [ "$WATCHLIST_MATCHES" != "null" ]; then
  echo -e "${GREEN}✅ Address watchlist data received: $WATCHLIST_MATCHES match(es)${NC}"
else
  echo -e "${YELLOW}⚠️  No address watchlist data${NC}"
fi

# Test GET endpoint
echo -e "\n${YELLOW}Test 4: Fetch Customer Review${NC}"
REVIEW_RESPONSE=$(curl -s "$API_URL/api/customers/$CUSTOMER_ID/review")

REVIEW_KYC=$(echo "$REVIEW_RESPONSE" | jq -r '.kyc.decision')
if [ "$REVIEW_KYC" != "null" ] && [ -n "$REVIEW_KYC" ]; then
  echo -e "${GREEN}✅ Review endpoint returns KYC data: $REVIEW_KYC${NC}"
else
  echo -e "${RED}❌ Review endpoint missing KYC data${NC}"
  exit 1
fi

echo -e "\n${GREEN}🎉 All tests passed!${NC}"
echo -e "\nCustomer Details:"
echo "$RESPONSE" | jq '{
  id: .id,
  name: "\(.first_name) \(.last_name)",
  address: .address,
  compliance: .compliance_profile,
  kyc_decision: .review.kyc.decision,
  watchlist_matches: (.review.address_watchlist.matches | length)
}'
