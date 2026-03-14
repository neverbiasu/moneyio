# Backend

## How to Run Ruff

Ruff is used for linting and enforcing code style rules in the backend. Follow the steps below to run Ruff:

1. **Install Ruff**:
   Ensure Ruff is installed in your Python environment. If not, install it using pip:
   ```bash
   pip install ruff
   ```

2. **Run Ruff**:
   To check for linting issues, run the following command in the `backend` directory:
   ```bash
   ruff check .
   ```

3. **Auto-fix Issues**:
   To automatically fix certain linting issues, use:
   ```bash
   ruff check . --fix
   ```

4. **Configuration**:
   Ruff is configured in the `pyproject.toml` file located in the `backend` directory. You can modify the configuration as needed.

## Integration Seed Data

1. Run integration seed data command before frontend-backend test execution:
   ```bash
   python manage.py seed_integration_data --reset
   ```
2. This command creates deterministic data for account `tomori`.
3. Seed credentials are printed in terminal output after command execution.
