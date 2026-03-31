#!/bin/bash

# Luminary Kubernetes Deployment Script
# This script deploys the complete Luminary application to Kubernetes

echo "🚀 Deploying Luminary to Kubernetes..."

# Apply all Kubernetes manifests
echo "📋 Creating namespace and configurations..."
kubectl apply -f kubernetes/config.yml

echo "🗄️ Deploying MySQL database..."
kubectl apply -f kubernetes/mysql.yml

echo "⏳ Waiting for MySQL to be ready..."
kubectl wait --for=condition=ready pod -l app=mysql -n luminary --timeout=120s

echo "🔧 Deploying backend API..."
kubectl apply -f kubernetes/backend.yml

echo "⏳ Waiting for backend to be ready..."
kubectl wait --for=condition=ready pod -l app=backend -n luminary --timeout=60s

echo "🎨 Deploying frontend..."
kubectl apply -f kubernetes/frontend.yml

echo "⏳ Waiting for frontend to be ready..."
kubectl wait --for=condition=ready pod -l app=frontend -n luminary --timeout=60s

echo "✅ Deployment complete!"
echo ""
echo "🌐 Access the application:"
echo "   Frontend URL: kubectl get svc frontend-service -n luminary -o wide"
echo "   Backend URL: kubectl port-forward svc/backend-service 5000:5000 -n luminary"
echo ""
echo "🔍 Check pod status:"
echo "   kubectl get pods -n luminary"
echo ""
echo "📊 View logs:"
echo "   kubectl logs -f deployment/backend -n luminary"
echo "   kubectl logs -f deployment/frontend -n luminary"
