from pydantic import BaseModel, Field


class SettingsBase(BaseModel):
    theme: str = Field(default="dark")
    model_name: str = Field(default="gemini-2.5-flash")
    temperature: float = Field(default=0.70, ge=0.0, le=2.0)
    system_prompt: str = Field(default="You are a helpful assistant.")


class SettingsUpdate(BaseModel):
    theme: str = Field(default="dark")
    model_name: str = Field(default="gemini-2.5-flash")
    temperature: float = Field(default=0.70, ge=0.0, le=2.0)
    system_prompt: str = Field(default="You are a helpful assistant.")


class SettingsOut(SettingsBase):
    class Config:
        from_attributes = True
        orm_mode = True
