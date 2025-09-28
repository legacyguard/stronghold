#!/usr/bin/env bash
set -euo pipefail

# Resolve repo root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Optional local env file
ENV_FILE="${REPO_ROOT}/.env.providers.local"
if [ -f "${ENV_FILE}" ]; then
  set -a
  # shellcheck disable=SC1090
  . "${ENV_FILE}"
  set +a
fi

# Discover project ref from env or linked project
PROJECT_REF="${SUPABASE_PROJECT_REF:-}"
if [ -z "${PROJECT_REF}" ] && [ -f "${REPO_ROOT}/supabase/.temp/project-ref" ]; then
  PROJECT_REF="$(cat "${REPO_ROOT}/supabase/.temp/project-ref")"
fi

ACCESS_TOKEN="${SUPABASE_ACCESS_TOKEN:-}"
SITE_URL_PAYLOAD="${SITE_URL:-}"

GOOGLE_CLIENT_ID="${PROVIDER_GOOGLE_CLIENT_ID:-}"
GOOGLE_CLIENT_SECRET="${PROVIDER_GOOGLE_CLIENT_SECRET:-}"
GOOGLE_ADDITIONAL_IDS="${PROVIDER_GOOGLE_ADDITIONAL_CLIENT_IDS:-}"

APPLE_CLIENT_ID="${PROVIDER_APPLE_CLIENT_ID:-}"
APPLE_SECRET="${PROVIDER_APPLE_SECRET:-}"

DRY_RUN="${DRY_RUN:-}" # any non-empty value triggers dry-run

if [ -z "${PROJECT_REF}" ]; then
  echo "Error: SUPABASE_PROJECT_REF not set and no linked project found at supabase/.temp/project-ref" >&2
  exit 1
fi

if [ -z "${ACCESS_TOKEN}" ]; then
  echo "Error: SUPABASE_ACCESS_TOKEN is required (PAT with access to the project)" >&2
  exit 1
fi

# Build JSON payload
# Note: Only enable providers if credentials are present (unless DRY_RUN is set)
enable_google=false
enable_apple=false

if [ -n "${GOOGLE_CLIENT_ID}" ] && [ -n "${GOOGLE_CLIENT_SECRET}" ]; then
  enable_google=true
elif [ -n "${DRY_RUN}" ]; then
  enable_google=true
fi

if [ -n "${APPLE_CLIENT_ID}" ] && [ -n "${APPLE_SECRET}" ]; then
  enable_apple=true
elif [ -n "${DRY_RUN}" ]; then
  enable_apple=true
fi

# Compose additional client ids as JSON array if provided (comma-separated)
google_additional_json=null
if [ -n "${GOOGLE_ADDITIONAL_IDS}" ]; then
  IFS=',' read -r -a arr <<< "${GOOGLE_ADDITIONAL_IDS}"
  json_items=()
  for item in "${arr[@]}"; do
    trimmed="$(echo "$item" | awk '{$1=$1;print}')"
    if [ -n "${trimmed}" ]; then
      json_items+=("\"${trimmed}\"")
    fi
  done
  if [ ${#json_items[@]} -gt 0 ]; then
    google_additional_json="[${json_items[*]}]"
  fi
fi

# Escape JSON string values safely
json_escape() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

payload="{"
first=true

append_field() {
  if [ "$first" = true ]; then
    first=false
  else
    payload+="," 
  fi
  payload+="$1"
}

if [ "${enable_google}" = true ]; then google_enabled=true; else google_enabled=false; fi
append_field "\"external_google_enabled\": ${google_enabled}"
append_field "\"external_google_client_id\": \"$(json_escape \"${GOOGLE_CLIENT_ID}\")\""
append_field "\"external_google_secret\": \"$(json_escape \"${GOOGLE_CLIENT_SECRET}\")\""
if [ "${google_additional_json}" = "null" ]; then
  append_field "\"external_google_additional_client_ids\": null"
else
  append_field "\"external_google_additional_client_ids\": ${google_additional_json}"
fi

if [ "${enable_apple}" = true ]; then apple_enabled=true; else apple_enabled=false; fi
append_field "\"external_apple_enabled\": ${apple_enabled}"
append_field "\"external_apple_client_id\": \"$(json_escape \"${APPLE_CLIENT_ID}\")\""
append_field "\"external_apple_secret\": \"$(json_escape \"${APPLE_SECRET}\")\""

if [ -n "${SITE_URL_PAYLOAD}" ]; then
  append_field "\"site_url\": \"$(json_escape \"${SITE_URL_PAYLOAD}\")\""
fi

payload+="}"

API_URL="https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth"

if [ -n "${DRY_RUN}" ]; then
  echo "[DRY RUN] Would PATCH: ${API_URL}"
  echo "[DRY RUN] Payload:"
  echo "${payload}"
  exit 0
fi

# Ensure required creds present when not dry run
missing=()
if [ "${enable_google}" = true ]; then
  [ -z "${GOOGLE_CLIENT_ID}" ] && missing+=("PROVIDER_GOOGLE_CLIENT_ID")
  [ -z "${GOOGLE_CLIENT_SECRET}" ] && missing+=("PROVIDER_GOOGLE_CLIENT_SECRET")
fi
if [ "${enable_apple}" = true ]; then
  [ -z "${APPLE_CLIENT_ID}" ] && missing+=("PROVIDER_APPLE_CLIENT_ID")
  [ -z "${APPLE_SECRET}" ] && missing+=("PROVIDER_APPLE_SECRET")
fi
if [ ${#missing[@]} -gt 0 ]; then
  echo "Error: Missing required variables: ${missing[*]}" >&2
  exit 1
fi

echo "Configuring auth providers for project: ${PROJECT_REF}"
echo "${payload}" | curl -sS -X PATCH "${API_URL}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  --data @- | cat

echo
echo "Done."


