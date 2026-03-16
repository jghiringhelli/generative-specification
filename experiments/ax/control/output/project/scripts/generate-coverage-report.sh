#!/bin/bash

echo "==================================="
echo "Generating Coverage Report"
echo "==================================="
echo ""

# Run tests with coverage
npm run test:coverage

echo ""
echo "==================================="
echo "Coverage Summary"
echo "==================================="
echo ""

# Display coverage summary
cat coverage/coverage-summary.json | jq '.total'

echo ""
echo "Coverage report generated in coverage/"
echo "Open coverage/lcov-report/index.html to view detailed report"
