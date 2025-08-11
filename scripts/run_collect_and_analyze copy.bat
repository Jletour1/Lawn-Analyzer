
@echo off
echo Activating venv and running the lawn pipeline...
if not exist .venv (
    echo Creating virtual environment...
    python -m venv .venv
)
call .venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt
python lawn_reddit_pipeline.py collect --subs lawncare landscaping plantclinic --limit 200
python lawn_reddit_pipeline.py analyze --model gpt-4o-mini
python lawn_reddit_pipeline.py export
echo Done.
