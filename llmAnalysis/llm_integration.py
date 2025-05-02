import sys
import argparse
from litellm import completion
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if not OPENAI_API_KEY:
    print("ERROR: OPENAI_API_KEY not found in .env file.")
    sys.exit(1)

# Prompt Templates
SIMPLE_PROMPT = """
You are a security expert. Analyze the following CodeQL issue:

{issue}

1. Is this a real vulnerability or a false positive?
2. If exploitable, show a specific input an attacker might use.
3. Suggest two remediation strategies:
    - One that keeps the current structure but sanitizes input.
    - One that redesigns the code more robustly.

Keep it focused and clear.
"""

COT_PROMPT = """
You are a security expert. Analyze the following CodeQL issue:

{issue}

Let's think step by step:

1. Consider if this is a true vulnerability. Justify your reasoning.
2. If exploitable, walk through the attack process.
3. Brainstorm two fixes: one minimal, one structural, with code examples.

Clearly show your thought process.
"""

PANEL_PROMPT = """
You are coordinating a panel of security experts. Each expert has a different specialization. They have all received the same CodeQL issue to analyze independently.

CodeQL Issue:
{issue}

Respond as follows, with clearly labeled sections. Each expert should provide their own reasoning, not referencing the others.

Expert 1 – Secure Coding Specialist:
- Assess whether the issue is a real vulnerability or a false positive based on the code structure.
- Highlight secure coding principles that are (or are not) followed.
- Provide a secure remediation while preserving the intent of the original code.

Expert 2 – Exploit Simulation Engineer:
- Determine if and how this issue could be practically exploited.
- Craft an example exploit (e.g. HTTP request, payload, CLI input).
- Explain what happens during the exploit and its potential impact.

Expert 3 – Defensive Architect:
- Suggest a long-term design change that would eliminate this class of issue entirely.
- Discuss trade-offs (complexity, performance, maintainability).
- Include pseudocode or structural ideas where useful.

Each expert should be clear, focused, and avoid speculation. The goal is to understand the issue deeply and identify actionable security improvements.
"""

CONSENSUS_PROMPT = """
You are a lead security engineer. You've received 3 analyses of a CodeQL issue:

Response A:
{response_1}

Response B:
{response_2}

Response C:
{response_3}

Please synthesize a consensus. If all agree, summarize it. If there's disagreement, explain and choose the most correct.

Output in a professional, clear style.
"""

# Helper function to format the prompt based on style specified by user (see usage)
def build_prompt(issue: str, style: str) -> str:
    issue = issue.strip()
    if style == "simple":
        return SIMPLE_PROMPT.format(issue=issue)
    elif style == "cot":
        return COT_PROMPT.format(issue=issue)
    elif style == "poe":
        return PANEL_PROMPT.format(issue=issue)
    else:
        raise ValueError("Unknown style. Use one of: simple, cot, panel.")

# Helper function that calls the endpoint n times for consensus
def generate_opinions(issue: str, style: str, n: int = 3) -> list:
    prompt = build_prompt(issue, style)
    messages = [{"role": "user", "content": prompt}]
    print(f"\nGenerating {n} responses using style: {style}...")

    responses = []
    for i in range(n):
        res = completion(
            model="gpt-4",
            messages=messages,
            temperature=1.0,
            api_key=OPENAI_API_KEY
        )
        content = res['choices'][0]['message']['content']
        responses.append(content)
        print(f"\nResponse {i+1}:\n{'-'*20}\n{content}\n")
    return responses

# Calls a consensus/summary prompt on the responses (currently hard-coded to 3)
def synthesize_consensus(responses: list) -> str:
    summary_prompt = CONSENSUS_PROMPT.format(response_1=responses[0], response_2=responses[1], response_3=responses[2])
    result = completion(
        model="gpt-4",
        messages=[{"role": "user", "content": summary_prompt}],
        api_key=OPENAI_API_KEY
    )
    return result['choices'][0]['message']['content']


def main():
    parser = argparse.ArgumentParser(description="Analyze a CodeQL issue using different LLM prompting styles.")
    parser.add_argument("style", choices=["simple", "cot", "poe"], help="Prompting style to use.")
    parser.add_argument("file", help="Path to the CodeQL issue file.")
    # parser.add_argument("--n", type=int, default=3, help="Number of LLM responses to generate (default 3).")
    args = parser.parse_args()

    with open(args.file, 'r', encoding='utf-8') as f:
        issue_text = f.read()

    # responses = generate_opinions(issue_text, args.style, n=args.n)
    responses = generate_opinions(issue_text, args.style)
    consensus = synthesize_consensus(responses)

    print("\nCONSENSUS:\n" + "="*30)
    print(consensus)


if __name__ == "__main__":
    main()
