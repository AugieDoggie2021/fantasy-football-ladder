## Linting & Formatting

- Run lint: `bash Scripts/lint.sh`
- Run format: `bash Scripts/format.sh`

### Pre-commit hook (manual setup)
Copy the following to `.git/hooks/pre-commit` and make it executable:

```bash
#!/bin/bash
Scripts/format.sh
Scripts/lint.sh
```




