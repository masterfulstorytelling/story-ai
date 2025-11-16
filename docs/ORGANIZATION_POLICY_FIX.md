# Fixing Organization Policy for Public Cloud Run Access

If you're seeing "Forbidden" errors when accessing your Cloud Run services, it's likely due to an organization policy that restricts public access.

## Check Current Policy

```bash
gcloud resource-manager org-policies describe \
  constraints/run.allowedIngress \
  --project=YOUR_PROJECT_ID
```

## Option 1: Allow Public Access (Recommended for MVP)

If you have organization admin access:

1. Go to [Organization Policies Console](https://console.cloud.google.com/iam-admin/orgpolicies)
2. Search for: `run.allowedIngress`
3. Set it to allow `all` or `internal-and-cloud-load-balancing`

Or via command line (if you have permissions):

```bash
# Allow all ingress (public access)
gcloud resource-manager org-policies set-policy \
  constraints/run.allowedIngress \
  --project=YOUR_PROJECT_ID \
  --policy-file=- <<EOF
{
  "spec": {
    "rules": [
      {
        "allowAll": true
      }
    ]
  }
}
EOF
```

## Option 2: Use Authenticated Access

If you can't change the organization policy, you can require users to authenticate:

1. Remove `--allow-unauthenticated` from deployment
2. Users will need to sign in with Google to access
3. You can also create service accounts for programmatic access

## Option 3: Use Cloud Load Balancer

Set up a Cloud Load Balancer that can bypass some restrictions:

1. Create a load balancer
2. Point it to your Cloud Run services
3. Configure IAM at the load balancer level

## Quick Test

After updating the policy, test access:

```bash
curl https://storyai-staging-frontend-YOUR_PROJECT_ID.us-central1.run.app
```

If you get HTML content instead of "Forbidden", the policy is working!

