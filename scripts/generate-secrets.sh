#!/bin/bash
# Generate Docker secrets for production deployment

set -e

SECRETS_DIR="./secrets"

echo "🔐 Generating Docker secrets for production..."
echo ""

# Create secrets directory if it doesn't exist
mkdir -p "$SECRETS_DIR"

# Function to generate a secret
generate_secret() {
    local file=$1
    local length=$2
    local description=$3

    if [ -f "$SECRETS_DIR/$file" ]; then
        read -p "⚠️  $file already exists. Overwrite? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Skipping $file"
            return
        fi
    fi

    echo "Generating $description..."
    openssl rand -base64 "$length" | tr -d '\n' > "$SECRETS_DIR/$file"
    chmod 600 "$SECRETS_DIR/$file"
    echo "✓ Created $file ($(wc -c < "$SECRETS_DIR/$file") characters)"
}

# Generate secrets
generate_secret "db_root_password.txt" 32 "MySQL root password"
generate_secret "db_password.txt" 32 "MySQL user password"
generate_secret "jwt_secret.txt" 64 "JWT signing secret"

echo ""
echo "✅ All secrets generated successfully!"
echo ""
echo "📋 Summary:"
echo "  - MySQL root password: $SECRETS_DIR/db_root_password.txt"
echo "  - MySQL user password: $SECRETS_DIR/db_password.txt"
echo "  - JWT secret: $SECRETS_DIR/jwt_secret.txt"
echo ""
echo "⚠️  Security reminders:"
echo "  - These files contain sensitive data"
echo "  - Never commit them to git"
echo "  - Back them up securely (encrypted)"
echo "  - Rotate them periodically"
echo ""

# Verify no trailing newlines
echo "🔍 Verifying secret format..."
for file in db_root_password.txt db_password.txt jwt_secret.txt; do
    if [ -f "$SECRETS_DIR/$file" ]; then
        if od -An -tx1 "$SECRETS_DIR/$file" | tail -1 | grep -q '0a'; then
            echo "❌ Warning: $file has a trailing newline!"
        else
            echo "✓ $file format is correct"
        fi
    fi
done

echo ""
echo "🚀 You can now start the production environment with:"
echo "   docker-compose -f docker-compose.prod.yml up -d"
