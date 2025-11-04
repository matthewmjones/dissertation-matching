# AI-Powered Dissertation Supervisor Matching System

An intelligent matching system that pairs dissertation students with supervisors using advanced AI techniques including OpenAI embeddings and Large Language Model (LLM) re-ranking, combined with traditional academic expertise scoring.

![React](https://img.shields.io/badge/React-19.1.1-61DAFB?style=flat-square&logo=react)
![OpenAI](https://img.shields.io/badge/OpenAI-API-412991?style=flat-square&logo=openai)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)
![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen?style=flat-square)

## Overview

This React-based web application was developed for **UCL School of Management** to optimize the dissertation supervisor assignment process. It uses a hybrid AI approach combining semantic similarity analysis with traditional academic scoring to create optimal student-supervisor matches while respecting capacity constraints and preferences.

## Quick Start

### Prerequisites

- Node.js 14+ and npm
- OpenAI API key in the local environment variable $OPENAI_API_KEY
- A local embedding model running on port 8000

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/matthewmjones/dissertation-matching
   cd dissertation-matching
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables (optional)**
   ```bash
   # Create .env file in project root
   echo "REACT_APP_OPENAI_API_KEY=your_openai_api_key_here" > .env
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

## 📋 Data Format

### Student Data (CSV)
Required columns:
- `student_id`: Unique identifier
- `name`: Student name
- `primary_subject`: Main subject area
- `secondary_subject`: Optional secondary subject
- `methodology_needs`: Comma-separated methods (e.g., "statistics,qualitative")
- `abstract`: Dissertation project description

### Supervisor Data (CSV)
Required columns:
- `supervisor_id`: Unique identifier
- `name`: Supervisor name
- `capacity`: Maximum number of students
- `[subject]_confidence`: Confidence scores (1-5) for each subject
- `[method]_confidence`: Confidence scores (1-5) for each methodology
- `will_not_supervise`: Comma-separated subjects to exclude
- `research_interests`: Detailed research description
- `is_default`: Boolean indicating default supervisor status

## Algorithm Description

### Hybrid AI + Traditional Matching with Constrained Optimization

The system employs a sophisticated multi-stage algorithm that combines modern AI techniques with traditional academic matching criteria.

#### **Stage 1: Semantic Analysis**
```
Student Abstract → Local embedding model
Supervisor Research → Local embedding model
Similarity = cosine_similarity(student_vector, supervisor_vector)
```

- Converts text to high-dimensional semantic vectors using a local embedding model (I use SPECTER2)
- Calculates cosine similarity for all student-supervisor pairs

#### **Stage 2: LLM Re-ranking**
```
For top-K matches per supervisor (default K=3):
    GPT Score = LLM_evaluate(student_abstract, supervisor_interests)
    Blended Score = 0.7 × GPT_score + 0.3 × embedding_score
```
**Note:** the names of students and supervisors are never included in prompts to the LLM.

- Uses GPT-4o-mini or GPT-4o to evaluate alignment on 0-10 scale
- Focuses computational resources on most promising matches
- Provides nuanced understanding of research compatibility

#### **Stage 3: Traditional Academic Scoring**
```
Subject Score = (primary_subject_confidence × 1.0) +
                (secondary_subject_confidence × 0.3)

Methodology Score = Σ(method_confidence) / count(methods)

Traditional Score = (0.6 × Subject_score) + (0.4 × Methodology_score)
```

- Leverages supervisor confidence ratings in specific domains
- Applies heavy penalty (×0.3) for weak primary subject matches
- Ensures academic expertise alignment

#### **Stage 4: Score Fusion**
```
Final Score = (0.4 × AI_semantic_score) + (0.6 × Traditional_score)
```

- Balances AI insights with traditional academic criteria
- Weights favor proven academic expertise matching

#### **Stage 5: Constrained Assignment**
```
1. Apply hard constraints (eliminate "will_not_supervise" matches)
2. Sort all possible matches by final score (descending)
3. Greedy assignment respecting supervisor capacity limits
4. Assign unmatched students to default supervisors
```

- Uses greedy algorithm for capacity-constrained assignment
- Ensures no supervisor exceeds their stated capacity
- Provides fallback mechanism for unmatched students

## Design System

### Typography
- **Headings**: Sansation (Google Fonts) - Clean, modern sans-serif
- **Body Text**: Radley (Google Fonts) - Readable serif for academic content

### UX Features
- CSS custom properties for consistent theming
- 8px spacing grid system
- Subtle shadows and gradients
- Smooth transitions and micro-animations
- Responsive design (mobile-first)
- WCAG AA accessibility compliance

## Available Scripts

```bash
npm start          # Start development server
npm test           # Run test suite
npm run build      # Create production build
npm run eject      # Eject from Create React App (one-way)
```

## Usage Guide

1. **Configure AI Settings**
   - Set Top-K for re-ranking (1-10)
   - Select re-ranker model (GPT-4o-mini/GPT-4o)

2. **Import Data**
   - Paste student CSV data or use sample data
   - Paste supervisor CSV data or use sample data

3. **Run Matching**
   - Click "Run AI Matching Algorithm"

4. **Review Results**
   - View assignment statistics
   - Examine match scores and rationale
   - Download results as CSV

## 🏗️ Architecture

```
src/
├── App.js              # Main application component
├── App.css             # Complete design system
├── App.test.js         # Component tests
├── index.js            # React entry point
└── index.css           # Global styles
```

### Key Components
- **DissertationMatchingSystem**: Main application logic
- **AI Configuration**: Model selection and parameters
- **Data Input**: CSV parsing and validation
- **Matching Engine**: Core algorithm implementation
- **Results Display**: Statistics and assignment tables

## Configuration

### Algorithm Parameters
- **Top-K Re-ranking**: Number of top matches to re-evaluate with LLM (default: 3)
- **Embedding Model**: Local on port 8000. I use SPECTER2
- **Re-ranker Model**: `gpt-4o-mini` (cost-effective) or `gpt-4o` (highest quality)
- **Score Weights**: 40% semantic + 60% traditional (configurable in code)

## Security & Privacy

- **API Key Security**: Stored in environment variables, not in code
- **Data Privacy**: All processing happens locally, no data stored on servers
- **OpenAI Compliance**: Follows OpenAI usage policies and data handling guidelines

## Testing

```bash
npm test                    # Run all tests
npm test -- --coverage     # Run with coverage report
```

### Test Coverage
- Component rendering and state management
- CSV parsing and data validation
- Algorithm scoring functions
- Error handling and edge cases

## Deployment

### Production Build
```bash
npm run build
```

### Static Hosting (Recommended)
```bash
npm install -g serve
serve -s build
```

### Environment Setup
Ensure production environment has:
- Valid OpenAI API key
- HTTPS enabled (required for secure OpenAI API calls)
- Appropriate CORS settings if needed

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

### MIT License Summary
- **Free to use, modify, and distribute**
- **Commercial use permitted**
- **No warranty or liability**
- **Attribution required** (keep copyright notice)

Copyright © 2025 Matthew M. Jones UCL School of Management. The MIT License ensures maximum flexibility for academic institutions and researchers while maintaining proper attribution.