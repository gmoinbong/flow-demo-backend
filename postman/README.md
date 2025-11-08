# Postman Collection

## Installation

1. Import `CreatorFlow.postman_collection.json` and `CreatorFlow.postman_environment.json`
2. Select environment "CreatorFlow Local"

## Usage

1. `Auth → Login` - token will be saved automatically
2. `Scraper → Fetch Posts` - specify real UUIDs in body

## Request Fields

- `username` - required (e.g., "mrbeast")
- `platform` - required ("instagram", "tiktok", "youtube")
- `brandId` - optional (campaign filter, together with campaignId)
- `campaignId` - optional (campaign filter, together with brandId)
- `limit` - 1-100 (default: 50)

