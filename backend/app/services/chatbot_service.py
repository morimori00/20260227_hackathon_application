import io
import json
import logging
import traceback
from contextlib import redirect_stdout

import numpy as np
import pandas as pd
from openai import OpenAI

from app.config import OPENAI_API_KEY, OPENAI_MODEL, LOCAL_BASE_URL, LOCAL_MODEL, LOCAL_API_KEY
from app.data_store import DataStore

logger = logging.getLogger(__name__)

MAX_OUTPUT_SIZE = 10 * 1024  # 10KB

SYSTEM_PROMPT = """You are an AML (Anti-Money Laundering) analysis assistant. You have access to a transaction DataFrame that you can query using Python/pandas.

The DataFrame `df` has the following columns:
- id (str): Transaction ID (e.g. "txn_00000001")
- timestamp (datetime): Transaction timestamp
- from_bank (str): Sender bank ID
- from_account (str): Sender account ID
- to_bank (str): Receiver bank ID
- to_account (str): Receiver account ID
- amount_received (float): Amount received
- receiving_currency (str): Currency of amount received
- amount_paid (float): Amount paid
- payment_currency (str): Currency of payment
- payment_format (str): Payment method (e.g. "Cheque", "ACH", "Wire")
- day_of_week (str): Day name (e.g. "Monday")
- hour (int): Hour of day (0-23)
- prediction (int): ML model prediction (0=normal, 1=flagged as suspicious)
- fraud_score (float): ML model confidence score (0.0-1.0)

When the user asks a question, use the run_python tool to execute pandas code to analyze the data. Always use print() to output results. Keep your analysis focused and clear. When presenting results, format them nicely for the user."""

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "run_python",
            "description": "Execute Python code against the transaction DataFrame. The variable `df` is the live transactions DataFrame. `pd` (pandas) and `np` (numpy) are available. Use print() to output results.",
            "parameters": {
                "type": "object",
                "properties": {
                    "code": {
                        "type": "string",
                        "description": "Python code to execute",
                    }
                },
                "required": ["code"],
            },
        },
    }
]


def _execute_code(code: str, df: pd.DataFrame) -> str:
    buf = io.StringIO()
    namespace = {"df": df, "pd": pd, "np": np}
    try:
        with redirect_stdout(buf):
            exec(code, namespace)
        output = buf.getvalue()
        if not output:
            # Check if last expression has a value
            output = "(No output)"
        if len(output) > MAX_OUTPUT_SIZE:
            output = output[:MAX_OUTPUT_SIZE] + "\n... (truncated)"
        return output
    except Exception:
        return f"Error:\n{traceback.format_exc()}"


class ChatbotService:
    def __init__(self, data_store: DataStore):
        self.data_store = data_store
        self.normal_client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None
        self.local_client = (
            OpenAI(api_key=LOCAL_API_KEY, base_url=LOCAL_BASE_URL)
            if LOCAL_BASE_URL and LOCAL_API_KEY
            else None
        )

    def _get_client_and_model(self, model: str) -> tuple[OpenAI | None, str]:
        if model == "local" and self.local_client:
            return self.local_client, LOCAL_MODEL
        return self.normal_client, OPENAI_MODEL

    def chat(self, messages: list[dict], model: str = "normal") -> str:
        client, model_name = self._get_client_and_model(model)
        if not client:
            return f"API key is not configured for '{model}' model."

        api_messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        for m in messages:
            api_messages.append({"role": m["role"], "content": m["content"]})

        # Multi-turn tool calling loop
        for _ in range(10):
            response = client.chat.completions.create(
                model=model_name,
                messages=api_messages,
                tools=TOOLS,
                tool_choice="auto",
            )

            choice = response.choices[0]

            if choice.finish_reason == "tool_calls" and choice.message.tool_calls:
                api_messages.append(choice.message)
                for tool_call in choice.message.tool_calls:
                    args = json.loads(tool_call.function.arguments)
                    output = _execute_code(args["code"], self.data_store.transactions)
                    api_messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "content": output,
                    })
            else:
                return choice.message.content or ""

        return "Maximum tool call iterations reached."

    async def chat_stream(self, messages: list[dict], model: str = "normal"):
        client, model_name = self._get_client_and_model(model)
        if not client:
            yield f"data: {json.dumps({'type': 'content', 'content': f\"API key is not configured for '{model}' model.\"})}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
            return

        api_messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        for m in messages:
            api_messages.append({"role": m["role"], "content": m["content"]})

        for _ in range(10):
            stream = client.chat.completions.create(
                model=model_name,
                messages=api_messages,
                tools=TOOLS,
                tool_choice="auto",
                stream=True,
            )

            content_buffer = ""
            tool_calls_map: dict[int, dict] = {}
            finish_reason = None

            for chunk in stream:
                delta = chunk.choices[0].delta if chunk.choices else None
                finish_reason = chunk.choices[0].finish_reason if chunk.choices else None

                if delta and delta.content:
                    content_buffer += delta.content
                    yield f"data: {json.dumps({'type': 'content', 'content': delta.content})}\n\n"

                if delta and delta.tool_calls:
                    for tc in delta.tool_calls:
                        idx = tc.index
                        if idx not in tool_calls_map:
                            tool_calls_map[idx] = {
                                "id": tc.id or "",
                                "name": tc.function.name if tc.function and tc.function.name else "",
                                "arguments": "",
                            }
                        if tc.id:
                            tool_calls_map[idx]["id"] = tc.id
                        if tc.function and tc.function.name:
                            tool_calls_map[idx]["name"] = tc.function.name
                        if tc.function and tc.function.arguments:
                            tool_calls_map[idx]["arguments"] += tc.function.arguments

            if finish_reason == "tool_calls" and tool_calls_map:
                # Build assistant message for context
                assistant_msg = {"role": "assistant", "content": content_buffer or None, "tool_calls": []}
                for idx in sorted(tool_calls_map.keys()):
                    tc_data = tool_calls_map[idx]
                    assistant_msg["tool_calls"].append({
                        "id": tc_data["id"],
                        "type": "function",
                        "function": {
                            "name": tc_data["name"],
                            "arguments": tc_data["arguments"],
                        },
                    })
                api_messages.append(assistant_msg)

                for idx in sorted(tool_calls_map.keys()):
                    tc_data = tool_calls_map[idx]
                    args = json.loads(tc_data["arguments"])
                    code = args.get("code", "")

                    yield f"data: {json.dumps({'type': 'tool_start', 'code': code})}\n\n"

                    output = _execute_code(code, self.data_store.transactions)

                    yield f"data: {json.dumps({'type': 'tool_result', 'output': output})}\n\n"

                    api_messages.append({
                        "role": "tool",
                        "tool_call_id": tc_data["id"],
                        "content": output,
                    })
                # Continue loop for next LLM call
            else:
                # Done
                break

        yield f"data: {json.dumps({'type': 'done'})}\n\n"
