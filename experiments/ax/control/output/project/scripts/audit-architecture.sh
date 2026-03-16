#!/bin/bash

echo "==================================="
echo "Architecture Audit: Route Layer"
echo "==================================="
echo ""

echo "Checking for direct prisma calls in route files..."
echo ""

VIOLATIONS=0

for file in src/routes/*.ts; do
  if [ -f "$file" ]; then
    filename=$(basename "$file")
    
    # Check if prisma client is instantiated (allowed at top level)
    prisma_instantiation=$(grep -n "new PrismaClient()" "$file" | wc -l)
    
    # Check for prisma method calls inside route handlers
    prisma_calls=$(grep -n "prisma\." "$file" | grep -v "new PrismaClient" | grep -v "^//" | wc -l)
    
    if [ $prisma_calls -gt 0 ]; then
      echo "❌ $filename - Found $prisma_calls direct prisma calls in route handlers"
      grep -n "prisma\." "$file" | grep -v "new PrismaClient" | grep -v "^//"
      VIOLATIONS=$((VIOLATIONS + 1))
    else
      echo "✅ $filename - No direct database calls in handlers"
    fi
  fi
done

echo ""
echo "==================================="
echo "Summary"
echo "==================================="

if [ $VIOLATIONS -eq 0 ]; then
  echo "✅ All route files follow layered architecture"
  echo "✅ No direct database calls found in route handlers"
else
  echo "❌ Found $VIOLATIONS route file(s) with layer violations"
  exit 1
fi
