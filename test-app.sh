#!/bin/bash

echo "🧪 LearnChat App Testing Script"
echo "================================"
echo ""

# Check if server is running
echo "1. Checking if dev server is running..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "   ✅ Server is running at http://localhost:3000"
else
    echo "   ❌ Server is not running. Start it with: npm run dev"
    exit 1
fi

# Check environment variables
echo ""
echo "2. Checking environment variables..."
if [ -f .env.local ]; then
    echo "   ✅ .env.local file exists"
    
    # Check required variables
    REQUIRED_VARS=("SUPABASE_URL" "SUPABASE_SERVICE_ROLE_KEY" "OPENAI_API_KEY" "NEXTAUTH_SECRET")
    ALL_SET=true
    
    for var in "${REQUIRED_VARS[@]}"; do
        if grep -q "^${var}=" .env.local && ! grep -q "^${var}=your-" .env.local && ! grep -q "^${var}=$" .env.local; then
            echo "   ✅ $var is set"
        else
            echo "   ⚠️  $var is not properly set"
            ALL_SET=false
        fi
    done
    
    if [ "$ALL_SET" = false ]; then
        echo "   ⚠️  Some required variables may need values"
    fi
else
    echo "   ❌ .env.local file not found"
    exit 1
fi

# Test API endpoints (basic check)
echo ""
echo "3. Testing API endpoints..."
echo "   Testing /api/auth/[...nextauth]..."
AUTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/auth/signin)
if [ "$AUTH_RESPONSE" = "200" ] || [ "$AUTH_RESPONSE" = "405" ]; then
    echo "   ✅ Auth endpoint is accessible (HTTP $AUTH_RESPONSE)"
else
    echo "   ⚠️  Auth endpoint returned HTTP $AUTH_RESPONSE"
fi

# Check page load
echo ""
echo "4. Testing main page..."
PAGE_TITLE=$(curl -s http://localhost:3000 | grep -o "<title>.*</title>" | sed 's/<[^>]*>//g' | head -1)
if [ ! -z "$PAGE_TITLE" ]; then
    echo "   ✅ Page loaded successfully"
    echo "   📄 Page title: $PAGE_TITLE"
else
    echo "   ⚠️  Could not load page title"
fi

echo ""
echo "================================"
echo "✅ Basic checks complete!"
echo ""
echo "🌐 Open your browser and visit:"
echo "   http://localhost:3000"
echo ""
echo "📋 For detailed testing, see: TESTING_CHECKLIST.md"
