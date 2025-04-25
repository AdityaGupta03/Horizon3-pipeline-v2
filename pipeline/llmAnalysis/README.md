# LLM Integration Usage

To use the new LLM integration file, you'll need to:

1. Install the required dependencies:
```bash
pip install litellm python-dotenv
```

2. Create a `.env` file in your project directory with your API keys, for example:
```
OPENAI_API_KEY=your_openai_api_key_here
```

3. Command line usage
```bash
python llm_integration.py simple path/to/issue.json
python llm_integration.py cot path/to/issue.json
python llm_integration.py poe path/to/issue.json
```

The command line interface supports:
- 'simple': Basic prompting style
- 'cot': Chain-of-thought reasoning
- 'poe': Principles-of-explanation method
- Specify the path to your CodeQL issue file as the second argument

## Note

The `Dockerfile` and `llmAnalysis.py` files in this project are not related to the new LLM integration code and should not be run with this new implementation.
