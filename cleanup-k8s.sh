#!/bin/bash

# Luminary Kubernetes Cleanup Script
# This script removes all Luminary resources from Kubernetes

echo "🧹 Cleaning up Luminary from Kubernetes..."

# Delete all resources
echo "🗑️ Removing frontend..."
kubectl delete -f kubernetes/frontend.yml --ignore-not-found=true

echo "🗑️ Removing backend..."
kubectl delete -f kubernetes/backend.yml --ignore-not-found=true

echo "🗑️ Removing MySQL..."
kubectl delete -f kubernetes/mysql.yml --ignore-not-found=true

echo "🗑️ Removing configurations..."
kubectl delete -f kubernetes/config.yml --ignore-not-found=true

echo "✅ Cleanup complete!"
echo ""
echo "🔍 Check remaining resources:"
echo "   kubectl get all -n luminary"
