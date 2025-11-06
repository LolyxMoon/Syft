-- Terminal AI Chat History Migration
-- This migration creates tables for storing Terminal AI conversation history

-- Table: terminal_conversations
-- Stores metadata about each conversation (session)
CREATE TABLE IF NOT EXISTS terminal_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL UNIQUE,
    wallet_address TEXT,
    title TEXT NOT NULL,
    message_count INTEGER DEFAULT 0,
    token_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: terminal_messages
-- Stores individual messages within conversations
CREATE TABLE IF NOT EXISTS terminal_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES terminal_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
    content TEXT NOT NULL,
    function_called TEXT,
    function_result JSONB,
    message_type TEXT DEFAULT 'text',
    tool_call_id TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_terminal_conversations_user_id ON terminal_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_terminal_conversations_session_id ON terminal_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_terminal_conversations_wallet_address ON terminal_conversations(wallet_address);
CREATE INDEX IF NOT EXISTS idx_terminal_conversations_updated_at ON terminal_conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_terminal_messages_conversation_id ON terminal_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_terminal_messages_timestamp ON terminal_messages(timestamp ASC);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_terminal_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at on conversation updates
CREATE TRIGGER trigger_update_terminal_conversation_timestamp
    BEFORE UPDATE ON terminal_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_terminal_conversation_timestamp();

-- Comments for documentation
COMMENT ON TABLE terminal_conversations IS 'Stores Terminal AI conversation sessions';
COMMENT ON TABLE terminal_messages IS 'Stores individual messages within Terminal AI conversations';
COMMENT ON COLUMN terminal_conversations.session_id IS 'Unique session identifier for the conversation';
COMMENT ON COLUMN terminal_conversations.title IS 'Auto-generated or user-defined title for the conversation';
COMMENT ON COLUMN terminal_messages.role IS 'Message role: user, assistant, system, or tool';
COMMENT ON COLUMN terminal_messages.function_called IS 'Name of blockchain function called (if applicable)';
COMMENT ON COLUMN terminal_messages.function_result IS 'JSON result of function execution';
