---
description: Automatically stage, commit, and push changes to the remote repository.
---

// turbo-all

1. Stage all changes
```bash
git add .
```

2. Commit with a generic update message (or user provided)
```bash
git commit -m "Auto-update: Applied latest changes" || echo "Nothing to commit"
```

3. Push to main
```bash
git push origin main
```
