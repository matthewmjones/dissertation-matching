# AI-Powered Dissertation Supervisor Matching System

An intelligent matching system that pairs dissertation students with supervisors using advanced AI techniques including OpenAI embeddings and Large Language Model (LLM) re-ranking, combined with traditional academic expertise scoring.

![React](https://img.shields.io/badge/React-19.1.1-61DAFB?style=flat-square&logo=react)
![OpenAI](https://img.shields.io/badge/OpenAI-API-412991?style=flat-square&logo=openai)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)
![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen?style=flat-square)

## 🎯 Overview

This React-based web application was developed for **UCL School of Management** to optimize the dissertation supervisor assignment process. It uses a hybrid AI approach combining semantic similarity analysis with traditional academic scoring to create optimal student-supervisor matches while respecting capacity constraints and preferences.

### Key Features

- **🤖 AI-Powered Matching**: OpenAI embeddings + GPT re-ranking for semantic understanding
- **📊 Traditional Scoring**: Subject expertise and methodology confidence ratings
- **⚖️ Constrained Optimization**: Respects supervisor capacity and preference constraints
- **📁 CSV Input/Output**: Easy data import and results export
- **📱 Responsive Design**: Modern, accessible interface with custom design system
- **🔧 Configurable**: Adjustable AI models, re-ranking parameters, and scoring weights

## 🚀 Quick Start

### Prerequisites

- Node.js 14+ and npm
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd dissertation-matching
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
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

## 🧠 Algorithm Description

### Hybrid AI + Traditional Matching with Constrained Optimization

The system employs a sophisticated multi-stage algorithm that combines modern AI techniques with traditional academic matching criteria.

#### **Stage 1: Semantic Analysis**
```
Student Abstract → OpenAI Embeddings (1536-dim vector)
Supervisor Research → OpenAI Embeddings (1536-dim vector)
Similarity = cosine_similarity(student_vector, supervisor_vector)
```

- Converts text to high-dimensional semantic vectors using OpenAI's `text-embedding-3-small` or `text-embedding-3-large`
- Calculates cosine similarity for all student-supervisor pairs
- Normalizes similarity scores to 0-10 range

#### **Stage 2: LLM Re-ranking**
```
For top-K matches per supervisor (default K=3):
    GPT Score = LLM_evaluate(student_abstract, supervisor_interests)
    Blended Score = 0.7 × GPT_score + 0.3 × embedding_score
```

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

### **Algorithmic Complexity**
- **Embedding Generation**: O(n + m) API calls
- **Similarity Calculation**: O(n × m) comparisons
- **LLM Re-ranking**: O(k × n × m) calls where k = top-K matches
- **Assignment**: O(n × m × log(n × m)) for sorting + O(n × m) for assignment
- **Total**: O(n × m × log(n × m)) + O(API_latency)

Where n = number of students, m = number of supervisors

### **Key Innovations**

1. **Semantic-Traditional Fusion**: Combines deep learning understanding with domain expertise
2. **Selective LLM Usage**: Re-ranks only top candidates to optimize cost/performance
3. **Multi-constraint Optimization**: Handles capacity limits and preference constraints
4. **Graceful Degradation**: Falls back to embedding-only if LLM calls fail
5. **Configurable Weights**: Allows tuning of AI vs traditional scoring balance

## 🎨 Design System

### Typography
- **Headings**: Sansation (Google Fonts) - Clean, modern sans-serif
- **Body Text**: Radley (Google Fonts) - Readable serif for academic content

### Color Palette
- **Background**: `#D6D2C4` (Warm neutral)
- **Primary**: `#500778` (Deep purple for headings)
- **Accent**: `#A4DBE8` (Soft blue for highlights)
- **Surface**: `#FFFFFF` (Clean white for cards)

### Modern UX Features
- CSS custom properties for consistent theming
- 8px spacing grid system
- Subtle shadows and gradients
- Smooth transitions and micro-animations
- Responsive design (mobile-first)
- WCAG AA accessibility compliance

## 🛠️ Available Scripts

```bash
npm start          # Start development server
npm test           # Run test suite
npm run build      # Create production build
npm run eject      # Eject from Create React App (one-way)
```

## 📊 Usage Guide

1. **Configure AI Settings**
   - Set Top-K for re-ranking (1-10)
   - Choose embedding model (small/large)
   - Select re-ranker model (GPT-4o-mini/GPT-4o)

2. **Import Data**
   - Paste student CSV data or use sample data
   - Paste supervisor CSV data or use sample data

3. **Run Matching**
   - Click "Run AI Matching Algorithm"
   - Monitor progress as AI processes matches

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

## 🔧 Configuration

### Environment Variables
```env
REACT_APP_OPENAI_API_KEY=your_openai_api_key_here
```

### Algorithm Parameters
- **Top-K Re-ranking**: Number of top matches to re-evaluate with LLM (default: 3)
- **Embedding Model**: `text-embedding-3-small` (faster) or `text-embedding-3-large` (more accurate)
- **Re-ranker Model**: `gpt-4o-mini` (cost-effective) or `gpt-4o` (highest quality)
- **Score Weights**: 40% semantic + 60% traditional (configurable in code)

## 📈 Performance Considerations

### Optimization Strategies
- **Selective LLM Usage**: Only re-rank top-K candidates (default K=3)
- **Batch Processing**: Parallel API calls where possible
- **Graceful Fallbacks**: Continue with embedding scores if LLM fails
- **Caching**: Results cached during session

### Cost Management
- Use `text-embedding-3-small` and `gpt-4o-mini` for cost efficiency
- Adjust Top-K parameter based on dataset size
- Monitor OpenAI usage through their dashboard

### Typical Performance
- **Small Dataset** (≤50 students, ≤20 supervisors): 30-60 seconds
- **Medium Dataset** (≤200 students, ≤50 supervisors): 2-5 minutes
- **Large Dataset** (500+ students, 100+ supervisors): 10-20 minutes

## 🔒 Security & Privacy

- **API Key Security**: Stored in environment variables, not in code
- **Data Privacy**: All processing happens locally, no data stored on servers
- **OpenAI Compliance**: Follows OpenAI usage policies and data handling guidelines

## 🧪 Testing

```bash
npm test                    # Run all tests
npm test -- --coverage     # Run with coverage report
```

### Test Coverage
- Component rendering and state management
- CSV parsing and data validation
- Algorithm scoring functions
- Error handling and edge cases

## 🚀 Deployment

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

## 📝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code style and patterns
- Add tests for new features
- Update documentation as needed
- Ensure accessibility standards are maintained

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

### MIT License Summary
- ✅ **Free to use, modify, and distribute**
- ✅ **Commercial use permitted**
- ✅ **No warranty or liability**
- ✅ **Attribution required** (keep copyright notice)

Copyright © 2024 UCL School of Management. The MIT License ensures maximum flexibility for academic institutions and researchers while maintaining proper attribution.

## 🤝 Acknowledgments

- **UCL School of Management** - Project sponsor and requirements
- **OpenAI** - AI models and embeddings API
- **React Team** - Frontend framework
- **Lucide React** - Icon library
- **Google Fonts** - Typography (Sansation & Radley)

## 📞 Support

For questions, issues, or feature requests:
- Create an issue in this repository
- Contact the development team
- Review the algorithm documentation above

---

**Built with ❤️ for UCL School of Management**

*Transforming dissertation supervision through intelligent AI-powered matching*