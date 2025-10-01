#!/bin/bash

# Vercel Environment Variables Setup Script
VERCEL_TOKEN="BMkkNaCsiZFWhCcuWeSKD3L4"
PROJECT_ID="stronghold"
TEAM_ID="legacyguards-projects"

# Function to set environment variable
set_env_var() {
    local key=$1
    local value=$2
    local target=$3

    echo "Setting $key for $target..."

    curl -X POST \
        "https://api.vercel.com/v9/projects/$PROJECT_ID/env?teamId=$TEAM_ID" \
        -H "Authorization: Bearer $VERCEL_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"key\": \"$key\",
            \"value\": \"$value\",
            \"target\": [\"$target\"],
            \"type\": \"encrypted\"
        }"
    echo ""
}

# Set all environment variables for production
echo "Setting up environment variables for Vercel production deployment..."

# Supabase Configuration
set_env_var "NEXT_PUBLIC_SUPABASE_URL" "https://egsekvyttvnmuliwwydo.supabase.co" "production"
set_env_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnc2Vrdnl0dHZubXVsaXd3eWRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5OTkyNDAsImV4cCI6MjA3NDU3NTI0MH0.sfHtuSRxYqHZIEh_6NhF2sAQxMNcuBobiYrh5Jad2K4" "production"
set_env_var "SUPABASE_SERVICE_ROLE_KEY" "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnc2Vrdnl0dHZubXVsaXd3eWRvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODk5OTI0MCwiZXhwIjoyMDc0NTc1MjQwfQ.lv9DQID_TPeVjpSMc7GlonpvBoJRwoTBydi7bpgvNRI" "production"

# Database URL
set_env_var "DATABASE_URL" "postgresql://postgres:axq8vwm0deg@db.egsekvyttvnmuliwwydo.supabase.co:5432/postgres" "production"

# Cron Security
set_env_var "CRON_SECRET" "stronghold_cron_secret_2024_secure_token_xyz789" "production"

# AI Configuration - OpenAI
set_env_var "OPENAI_API_KEY" "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" "production"

# AI Configuration - Google Cloud Vision
set_env_var "GOOGLE_CLOUD_VISION_API_KEY" "d1c9ea290fa3e0fef934f092d6b8979fc4055640" "production"

# LangSmith Configuration
set_env_var "LANGCHAIN_API_KEY" "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" "production"
set_env_var "LANGCHAIN_TRACING_V2" "true" "production"
set_env_var "LANGCHAIN_PROJECT" "legacyguard-documents" "production"

# Next.js Configuration
set_env_var "NEXT_TELEMETRY_DISABLED" "1" "production"

echo "Environment variables setup completed!"