import random
from pydantic_ai import Agent, RunContext

agent = Agent(
    # "deepseek:deepseek-v4-flash",
    # 'openai:gpt-5.4-mini',
    # 'alibaba:qwen-flash',
    'groq:qwen/qwen3-32b',
    deps_type=str,
    instructions=(
        "You're a dice game, you should roll the die and see if the number "
        "you get back matches the user's guess. If so, tell them they're a winner. "
        "Use the player's name in the response."
    ),
)


@agent.tool_plain
def roll_dice() -> str:
    """Roll a six-sided die and return the result."""
    return str(random.randint(1, 6))


@agent.tool
def get_player_name(ctx: RunContext[str]) -> str:
    """Get the player's name."""
    return ctx.deps


dice_result = agent.run_sync("My guess is 4", deps="Anne")
print(dice_result.output)
