# Argo CD / Kubernetes Baseline

## 1) Replace placeholders
- Update image registry owner in:
  - `deploy/k8s/backend/deployment.yaml`
  - `deploy/k8s/ai/deployment.yaml`
  - `deploy/k8s/frontend/deployment.yaml`
- Update Git repo URL in:
  - `deploy/argocd/backend-application.yaml`
  - `deploy/argocd/ai-application.yaml`
  - `deploy/argocd/frontend-application.yaml`

## 2) Prepare secrets in cluster
- `backend-secrets` in namespace `uniplace`
- `ai-secrets` in namespace `uniplace`

## 3) Apply Argo CD applications
```bash
kubectl apply -n argocd -f deploy/argocd/backend-application.yaml
kubectl apply -n argocd -f deploy/argocd/ai-application.yaml
kubectl apply -n argocd -f deploy/argocd/frontend-application.yaml
```

## 4) Notes
- Backend probe is TCP based (port `8080`) to avoid actuator dependency.
- AI probe uses `GET /health` on port `8000`.
- Frontend probe uses `GET /` on port `80`.
- AI `chroma_db` persistence uses PVC `ai-chroma-pvc` (`storageClassName: gp2`, `5Gi`).
- If `ai-chroma-pvc` is `Pending` after changing StorageClass, delete and recreate it:
```bash
kubectl -n uniplace delete pvc ai-chroma-pvc
kubectl apply -k deploy/k8s/ai
```
