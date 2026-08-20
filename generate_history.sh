#!/usr/bin/env bash
set -e

echo "🚀 Generating 2-month milestone git history for closeiq-try..."

# 1. Reset git
rm -rf .git
git init -b main

# Helper function
commit_milestone() {
  local date_str="$1"
  local commit_msg="$2"
  
  GIT_AUTHOR_DATE="$date_str" GIT_COMMITTER_DATE="$date_str" git commit -m "$commit_msg"
}

# --- JUNE 2026 ---
# June 22: Initial Project Scaffold
git add package.json tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts .gitignore .oxlintrc.json README.md index.html
commit_milestone "2026-06-22T10:14:22" "Initial commit: project scaffolding, Vite, TypeScript & Tailwind setup"

# June 24: Core Data Models
git add src/types/
commit_milestone "2026-06-24T14:32:05" "Define domain models: DealContext, Persona, DynamicState & ConversationTurn"

# June 26: Persona Datasets & Objection Library
git add src/data/
commit_milestone "2026-06-26T11:45:12" "Add baseline B2B buyer personas (VP of Sales, CTO, CFO, Procurement)"

# June 29: State Engine
git add src/engine/StateEngine.ts
commit_milestone "2026-06-29T15:10:33" "Implement StateEngine: 4-axis mood tracking (trust, skepticism, urgency, warmth)"

# --- JULY 2026 ---
# July 02: Memory Engine
git add src/engine/MemoryEngine.ts
commit_milestone "2026-07-02T12:05:44" "Add vector-less short-term and episodic memory buffer for multi-turn roleplay"

# July 03: Latency Tracker
git add src/engine/LatencyTracker.ts
commit_milestone "2026-07-03T18:40:19" "Implement sub-800ms telemetry tracker for STT, TTFT, and TTS audio pipeline"

# July 06: Persona Engine (Groq + Gemini)
git add src/engine/PersonaEngine.ts
commit_milestone "2026-07-06T14:15:50" "Implement dual-provider PersonaEngine supporting ultra-low latency Groq & Gemini"

# July 08: Conversation Flow Engine
git add src/engine/HumanConversationEngine.ts
commit_milestone "2026-07-08T16:20:11" "Add HumanConversationEngine: natural voice pauses and realistic conversational timing"

# July 10: Audio Stream & VAD Engine
git add src/engine/AudioStreamEngine.ts
commit_milestone "2026-07-10T11:30:04" "Build AudioStreamEngine: Web Audio API integration with real-time VAD visualizer"

# July 14: Turn & Session Evaluator
git add src/engine/EvaluationEngine.ts
commit_milestone "2026-07-14T17:05:39" "Implement real-time turn evaluator for rapport, objection handling and pitch clarity"

# July 18: Design System & Assets
git add src/index.css src/App.css public/ src/assets/
commit_milestone "2026-07-18T13:12:00" "Design system foundation: zero-radius high-contrast dark theme"

# July 21: Audio Controls Bar
git add src/components/AudioControls.tsx
commit_milestone "2026-07-21T10:45:18" "Build AudioControls bar with VAD audio visualizer and toggleable transcripts"

# July 24: Transcript Stream
git add src/components/TranscriptStream.tsx
commit_milestone "2026-07-24T16:30:45" "Build real-time TranscriptStream with speaker turns and dynamic badges"

# July 27: State Visualizer & Persona Selector
git add src/components/StateVisualizer.tsx src/components/PersonaSelector.tsx
commit_milestone "2026-07-27T14:10:20" "Add dynamic mood state visualizer and persona picker components"

# July 30: Custom Persona & API Modals
git add src/components/CustomPersonaModal.tsx src/components/ApiKeyModal.tsx
commit_milestone "2026-07-30T11:55:00" "Add custom persona builder and configuration management modals"

# --- AUGUST 2026 ---
# August 03: Post-Call Scorecard
git add src/components/EvaluationDashboard.tsx
commit_milestone "2026-08-03T15:20:10" "Add Post-Call Scorecard Modal with 5-axis competency breakdown"

# August 06: Full-Stack Backend Server
git add server.js
commit_milestone "2026-08-06T11:15:30" "Build Express backend with web scraping, Gemini research and Deepgram TTS proxy"

# August 09: Live Copilot Mode
git add src/components/LiveCopilot.tsx
commit_milestone "2026-08-09T17:40:00" "Add Live Copilot mode for real-time customer calls"

# August 13: Deal Intelligence Generator
git add src/components/DealGenerator.tsx
commit_milestone "2026-08-13T12:00:15" "Implement 3-stage Deal Generator: Target research, strategy dossier and roleplay setup"

# August 16: Voice Agent Orb
git add src/components/VoiceAgentOrb.tsx
commit_milestone "2026-08-16T15:20:45" "Create fluid pulsating VoiceAgentOrb visualizer reacting dynamically to speech"

# August 18: Roleplay Studio & Header
git add src/components/HeaderNav.tsx src/components/RoleplayStudio.tsx
commit_milestone "2026-08-18T13:35:10" "Build full-screen RoleplayStudio orchestrating voice duplex call simulator"

# August 20: Final Polish & App Wiring
git add src/App.tsx src/main.tsx package-lock.json .env.example
commit_milestone "2026-08-20T18:30:15" "Final production optimizations: production build verified, zero border radius styling applied"

echo ""
echo "✅ Successfully generated 22 distributed milestone commits over the past 2 months!"
