import React, { useState } from 'react';
import { Download, Play, Users, FileText, Brain, Zap } from 'lucide-react';
import './App.css';

const DissertationMatchingSystem = () => {
  const [studentData, setStudentData] = useState('');
  const [supervisorData, setSupervisorData] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState(process.env.REACT_APP_OPENAI_API_KEY || '');
  const [topK, setTopK] = useState(3);
  const [embeddingModel, setEmbeddingModel] = useState('text-embedding-3-small');
  const [rerankerModel, setRerankerModel] = useState('gpt-4o-mini');

  // Sample data for demonstration
  const sampleStudentData = `student_id,name,primary_subject,secondary_subject,methodology_needs,abstract
S001,Alice Johnson,Finance,Strategy,"statistics,quantitative","Analysis of merger performance in tech sector using event study methodology to examine stock price reactions and long-term value creation. Focus on technology acquisitions 2020-2024."
S002,Bob Smith,Marketing,,"qualitative,case_study","Consumer behavior analysis through in-depth interviews exploring brand loyalty in sustainable fashion. Thematic analysis of purchasing decisions and environmental consciousness."
S003,Carol Davis,Operations,Finance,"statistics,quantitative,optimization","Supply chain optimization using linear programming and statistical modeling to minimize costs while maintaining service levels in e-commerce logistics networks."
S004,David Wilson,Strategy,Marketing,"mixed_methods,case_study","Digital transformation strategies in retail: comparative case study analysis of traditional retailers adapting to omnichannel customer experiences."
S005,Emma Brown,Finance,,"statistics,econometrics","Impact of ESG scores on stock performance using panel data analysis of FTSE 100 companies over 2015-2023 period with robust econometric methods."`;

  const sampleSupervisorData = `supervisor_id,name,capacity,finance_confidence,marketing_confidence,strategy_confidence,operations_confidence,statistics_confidence,qualitative_confidence,econometrics_confidence,optimization_confidence,will_not_supervise,research_interests,is_default
SUP001,Prof. Anderson,8,5,2,4,3,5,2,4,3,"","My research focuses on corporate finance, particularly merger and acquisition performance, event studies, and valuation methods. I specialize in quantitative finance using econometric methods and statistical analysis of market reactions.",false
SUP002,Dr. Brown,10,1,5,3,2,2,5,1,1,Finance,"I study consumer psychology and brand management with emphasis on qualitative research methodologies. My work explores sustainable consumption, brand loyalty, and consumer decision-making processes through ethnographic and interview-based studies.",false
SUP003,Prof. Chen,6,3,2,5,4,4,3,2,4,"","Strategic management researcher focusing on digital transformation, organizational change, and business model innovation. I examine how companies adapt to technological disruption and develop competitive advantages in digital markets.",false
SUP004,Dr. Davis,12,2,3,2,5,4,3,2,5,"","Operations research specialist in supply chain management and process optimization. I develop mathematical models for logistics, inventory management, and network design using linear programming and simulation methods.",false
SUP005,Prof. Wilson,15,4,4,4,4,4,4,3,3,"","General management researcher with broad interests across finance, strategy, and operations. I supervise diverse projects using both quantitative and qualitative methodologies across all business domains.",true`;

  // OpenAI API functions
  const getEmbedding = async (text, model = 'text-embedding-3-small') => {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: text,
        model: model,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  };

  const rerankerLLM = async (studentAbstract, supervisorInterests, model = 'gpt-4o-mini') => {
    const prompt = `You are an expert academic supervisor matching system. Your task is to evaluate how well a supervisor's research expertise aligns with a student's dissertation project.

STUDENT PROJECT ABSTRACT:
${studentAbstract}

SUPERVISOR RESEARCH INTERESTS:
${supervisorInterests}

Please evaluate the alignment between this student's project and the supervisor's expertise. Consider:
1. Subject matter overlap and depth of supervisor knowledge in the project area
2. Methodological alignment between what the project requires and supervisor capabilities
3. Potential for meaningful guidance and support throughout the research process

Provide a score from 0-10 where:
- 0-2: Poor match, supervisor lacks relevant expertise
- 3-4: Weak match, limited overlap or guidance potential
- 5-6: Moderate match, some relevant expertise but not ideal
- 7-8: Good match, strong alignment in most areas
- 9-10: Excellent match, supervisor is ideally suited for this project

Respond with only a single number between 0-10.`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'user', content: prompt }
          ],
          max_tokens: 10,
          temperature: 0.1,
          seed: 123, // For reproducibility
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const scoreText = data.choices[0].message.content.trim();
      const score = parseFloat(scoreText);
      
      if (isNaN(score) || score < 0 || score > 10) {
        console.warn(`Invalid LLM score: ${scoreText}, defaulting to 5`);
        return 5;
      }
      
      return score;
    } catch (error) {
      console.warn(`LLM re-ranking failed: ${error.message}, using fallback score`);
      return 5; // Fallback score if LLM fails
    }
  };

  // Cosine similarity calculation
  const cosineSimilarity = (vecA, vecB) => {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have the same length');
    }
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    
    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);
    
    if (normA === 0 || normB === 0) {
      return 0;
    }
    
    return dotProduct / (normA * normB);
  };

  // Main matching score computation function
  const computeMatchScores = async (students, supervisors) => {
    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }

    const scoreMatrix = [];
    
    // Step 1: Get embeddings for all texts
    console.log('Computing embeddings...');
    const studentEmbeddings = [];
    const supervisorEmbeddings = [];
    
    for (const student of students) {
      try {
        const embedding = await getEmbedding(student.abstract, embeddingModel);
        studentEmbeddings.push(embedding);
      } catch (error) {
        console.error(`Failed to get embedding for student ${student.student_id}:`, error);
        studentEmbeddings.push(null);
      }
    }
    
    for (const supervisor of supervisors) {
      try {
        const embedding = await getEmbedding(supervisor.research_interests, embeddingModel);
        supervisorEmbeddings.push(embedding);
      } catch (error) {
        console.error(`Failed to get embedding for supervisor ${supervisor.supervisor_id}:`, error);
        supervisorEmbeddings.push(null);
      }
    }

    // Step 2: For each supervisor, compute scores for all students
    for (let supIndex = 0; supIndex < supervisors.length; supIndex++) {
      const supervisor = supervisors[supIndex];
      const supEmbedding = supervisorEmbeddings[supIndex];
      const supervisorScores = [];
      
      // Calculate embeddings similarity scores for all students
      const embeddingScores = [];
      for (let stuIndex = 0; stuIndex < students.length; stuIndex++) {
        const student = students[stuIndex];
        const stuEmbedding = studentEmbeddings[stuIndex];
        
        // Check hard constraints first
        const willNotSupervise = supervisor.will_not_supervise ? 
          supervisor.will_not_supervise.split(',').map(s => s.trim().toLowerCase()) : [];
        if (willNotSupervise.includes(student.primary_subject.toLowerCase())) {
          embeddingScores.push({ score: 0, studentIndex: stuIndex, isHardConstraint: true });
          continue;
        }

        // Calculate embedding similarity (0-1 range)
        let embeddingScore = 0;
        if (stuEmbedding && supEmbedding) {
          embeddingScore = cosineSimilarity(stuEmbedding, supEmbedding);
          // Normalize to 0-10 range for consistency
          embeddingScore = (embeddingScore + 1) * 5; // Convert from [-1,1] to [0,10]
        }
        
        embeddingScores.push({ 
          score: embeddingScore, 
          studentIndex: stuIndex, 
          isHardConstraint: false 
        });
      }

      // Step 3: Get top-k matches for LLM re-ranking
      const validScores = embeddingScores.filter(item => !item.isHardConstraint && item.score > 0);
      validScores.sort((a, b) => b.score - a.score);
      const topKIndices = new Set(validScores.slice(0, topK).map(item => item.studentIndex));

      // Step 4: Apply LLM re-ranking to top-k matches
      console.log(`Re-ranking top ${topK} matches for supervisor ${supervisor.name}...`);
      for (let stuIndex = 0; stuIndex < students.length; stuIndex++) {
        const student = students[stuIndex];
        const embeddingScore = embeddingScores[stuIndex];
        
        if (embeddingScore.isHardConstraint) {
          supervisorScores.push(0);
          continue;
        }

        let finalScore = embeddingScore.score;
        
        // Apply LLM re-ranking for top-k matches
        if (topKIndices.has(stuIndex) && finalScore > 0) {
          try {
            const llmScore = await rerankerLLM(student.abstract, supervisor.research_interests, rerankerModel);
            // Blend embedding score with LLM score (70% LLM, 30% embedding)
            finalScore = (0.7 * llmScore) + (0.3 * finalScore);
          } catch (error) {
            console.warn(`LLM re-ranking failed for ${student.student_id} - ${supervisor.supervisor_id}, using embedding score`);
            // Keep original embedding score as fallback
          }
        }

        // Step 5: Apply traditional subject/methodology scoring
        const traditionalScore = calculateTraditionalScore(student, supervisor);
        
        // Combine semantic similarity (40%) with traditional scoring (60%)
        const combinedScore = (0.4 * finalScore) + (0.6 * traditionalScore);
        
        supervisorScores.push(Math.round(combinedScore * 100) / 100);
      }
      
      scoreMatrix.push(supervisorScores);
    }

    return scoreMatrix;
  };

  // Traditional scoring (subject expertise + methodology)
  const calculateTraditionalScore = (student, supervisor) => {
    // Subject expertise score
    const primarySubjectKey = `${student.primary_subject.toLowerCase()}_confidence`;
    const primaryScore = supervisor[primarySubjectKey] || 1;
    
    let secondaryScore = 0;
    if (student.secondary_subject) {
      const secondarySubjectKey = `${student.secondary_subject.toLowerCase()}_confidence`;
      secondaryScore = (supervisor[secondarySubjectKey] || 1) * 0.3;
    }
    
    const subjectScore = primaryScore + secondaryScore;

    // Methodology score
    const methodologies = student.methodology_needs ? student.methodology_needs.split(',').map(m => m.trim()) : [];
    let methodologySum = 0;
    let methodologyCount = 0;
    
    methodologies.forEach(method => {
      const methodKey = `${method}_confidence`;
      if (supervisor[methodKey]) {
        methodologySum += supervisor[methodKey];
        methodologyCount++;
      }
    });
    
    const methodologyScore = methodologyCount > 0 ? methodologySum / methodologyCount : 3;

    // Calculate total traditional score (0-10 range)
    let traditionalScore = (0.7 * subjectScore) + (0.3 * methodologyScore);
    
    // Convert to 0-10 range
    traditionalScore = (traditionalScore / 5) * 10;

    // Heavy penalty for weak primary subject matches
    if (primaryScore < 2) {
      traditionalScore *= 0.3;
    }

    return traditionalScore;
  };

  // Hungarian algorithm for optimal assignment (simplified version)
  const hungarianAssignment = (students, supervisors, scoreMatrix) => {
    const assignments = [];
    const usedStudents = new Set();
    const supervisorAssignments = {};

    // Initialize supervisor assignment counts
    supervisors.forEach(sup => {
      supervisorAssignments[sup.supervisor_id] = 0;
    });

    // Sort all possible matches by score (descending)
    const allMatches = [];
    students.forEach((student, studentIndex) => {
      supervisors.forEach((supervisor, supervisorIndex) => {
        const score = scoreMatrix[supervisorIndex][studentIndex];
        if (score > 0) {
          allMatches.push({
            student,
            supervisor,
            score,
            studentIndex,
            supervisorIndex
          });
        }
      });
    });

    allMatches.sort((a, b) => b.score - a.score);

    // Assign matches greedily while respecting capacity constraints
    allMatches.forEach(match => {
      if (!usedStudents.has(match.studentIndex) && 
          supervisorAssignments[match.supervisor.supervisor_id] < match.supervisor.capacity) {
        assignments.push({
          student: match.student,
          supervisor: match.supervisor,
          score: match.score
        });
        usedStudents.add(match.studentIndex);
        supervisorAssignments[match.supervisor.supervisor_id]++;
      }
    });

    // Handle unassigned students with default supervisors
    const unassignedStudents = students.filter((_, index) => !usedStudents.has(index));
    const defaultSupervisors = supervisors.filter(sup => sup.is_default === 'true' || sup.is_default === true);
    
    unassignedStudents.forEach(student => {
      for (let supervisor of defaultSupervisors) {
        if (supervisorAssignments[supervisor.supervisor_id] < supervisor.capacity) {
          assignments.push({
            student,
            supervisor,
            score: 'Default Assignment'
          });
          supervisorAssignments[supervisor.supervisor_id]++;
          break;
        }
      }
    });

    return assignments;
  };

  const runMatching = async () => {
    setLoading(true);
    
    try {
      if (!apiKey) {
        alert('Please provide your OpenAI API key');
        setLoading(false);
        return;
      }

      // Parse CSV data
      const students = parseCSV(studentData);
      const supervisors = parseCSV(supervisorData);

      if (students.length === 0 || supervisors.length === 0) {
        alert('Please provide both student and supervisor data');
        setLoading(false);
        return;
      }

      // Calculate score matrix using new approach
      const scoreMatrix = await computeMatchScores(students, supervisors);

      // Run assignment algorithm
      const assignments = hungarianAssignment(students, supervisors, scoreMatrix);

      // Calculate statistics
      const totalStudents = students.length;
      const assignedStudents = assignments.length;
      const averageScore = assignments
        .filter(a => typeof a.score === 'number')
        .reduce((sum, a) => sum + a.score, 0) / assignments.filter(a => typeof a.score === 'number').length;

      setResults({
        assignments,
        statistics: {
          totalStudents,
          assignedStudents,
          averageScore: Math.round(averageScore * 100) / 100,
          unassignedStudents: totalStudents - assignedStudents
        }
      });

    } catch (error) {
      alert('Error processing data: ' + error.message);
      console.error('Matching error:', error);
    }
    
    setLoading(false);
  };

  const parseCSV = (csvText) => {
    if (!csvText.trim()) return [];
    
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      return obj;
    });
  };

  const downloadResults = () => {
    if (!results) return;
    
    const csvContent = [
      'Student ID,Student Name,Supervisor ID,Supervisor Name,Match Score,Primary Subject,Methodology Needs',
      ...results.assignments.map(a => 
        `${a.student.student_id},${a.student.name},${a.supervisor.supervisor_id},${a.supervisor.name},${a.score},${a.student.primary_subject},"${a.student.methodology_needs}"`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'supervisor_assignments.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800">Dissertation Supervisor Matching</h1>
        <p className="text-gray-600">UCL School of Management</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Student Data Input */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="flex items-center mb-4">
            <Users className="w-5 h-5 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold">Student Data</h2>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Required columns: student_id, name, primary_subject, secondary_subject, methodology_needs, abstract
          </p>
          <textarea
            className="w-full h-40 p-3 border border-gray-300 rounded-md font-mono text-sm"
            placeholder="Paste student CSV data here..."
            value={studentData}
            onChange={(e) => setStudentData(e.target.value)}
          />
          <button
            onClick={() => setStudentData(sampleStudentData)}
            className="mt-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-md text-sm hover:bg-blue-200"
          >
            Load Sample Data
          </button>
        </div>

        {/* Supervisor Data Input */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="flex items-center mb-4">
            <FileText className="w-5 h-5 text-green-600 mr-2" />
            <h2 className="text-xl font-semibold">Supervisor Data</h2>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Required columns: supervisor_id, name, capacity, [subject]_confidence, will_not_supervise, research_interests, is_default
          </p>
          <textarea
            className="w-full h-40 p-3 border border-gray-300 rounded-md font-mono text-sm"
            placeholder="Paste supervisor CSV data here..."
            value={supervisorData}
            onChange={(e) => setSupervisorData(e.target.value)}
          />
          <button
            onClick={() => setSupervisorData(sampleSupervisorData)}
            className="mt-2 px-4 py-2 bg-green-100 text-green-700 rounded-md text-sm hover:bg-green-200"
          >
            Load Sample Data
          </button>
        </div>
      </div>

      {/* Algorithm Settings */}
      <div className="bg-yellow-50 p-4 rounded-lg mb-6">
        <div className="flex items-center mb-2">
          <Zap className="w-5 h-5 text-yellow-600 mr-2" />
          <h3 className="font-semibold">Algorithm Details</h3>
        </div>
        <p className="text-sm text-gray-700">
          <strong>Scoring:</strong> 40% semantic similarity + 60% traditional (subject expertise + methodology fit)
          <br />
          <strong>Approach:</strong> OpenAI embeddings for semantic similarity + LLM re-ranking of top-{topK} matches per student
          <br />
        </p>
      </div>

      {/* API Configuration */}
      <div className="bg-blue-50 p-6 rounded-lg mb-6">
        <div className="flex items-center mb-4">
          <Brain className="w-5 h-5 text-blue-600 mr-2" />
          <h2 className="text-xl font-semibold">AI Configuration</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Top-K for Re-ranking</label>
            <input
              type="number"
              min="1"
              max="10"
              value={topK}
              onChange={(e) => setTopK(parseInt(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Embedding Model</label>
            <select
              value={embeddingModel}
              onChange={(e) => setEmbeddingModel(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="text-embedding-3-small">text-embedding-3-small</option>
              <option value="text-embedding-3-large">text-embedding-3-large</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Re-ranker Model</label>
            <select
              value={rerankerModel}
              onChange={(e) => setRerankerModel(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="gpt-4o-mini">gpt-4o-mini</option>
              <option value="gpt-4o">gpt-4o</option>
            </select>
          </div>
        </div>
      </div>



      {/* Run Matching */}
      <div className="text-center mb-6">
        <button
          onClick={runMatching}
          disabled={loading}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 flex items-center mx-auto"
        >
          {loading ? (
            <>Processing, please wait...</>
          ) : (
            <>
              <Play className="w-5 h-5 mr-2" />
              Run Matching Algorithm
            </>
          )}
        </button>
      </div>

      {/* Results */}
      {results && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Matching Results</h2>
            <button
              onClick={downloadResults}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Download CSV
            </button>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{results.statistics.totalStudents}</div>
              <div className="text-sm text-gray-600">Total Students</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{results.statistics.assignedStudents}</div>
              <div className="text-sm text-gray-600">Assigned</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-yellow-600">{results.statistics.averageScore}</div>
              <div className="text-sm text-gray-600">Avg Match Score</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-600">{results.statistics.unassignedStudents}</div>
              <div className="text-sm text-gray-600">Unassigned</div>
            </div>
          </div>

          {/* Assignment Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left">Student</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Primary Subject</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Methodology</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Supervisor</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">AI Match Score</th>
                </tr>
              </thead>
              <tbody>
                {results.assignments.map((assignment, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-300 px-4 py-2">{assignment.student.name}</td>
                    <td className="border border-gray-300 px-4 py-2">{assignment.student.primary_subject}</td>
                    <td className="border border-gray-300 px-4 py-2">{assignment.student.methodology_needs}</td>
                    <td className="border border-gray-300 px-4 py-2">{assignment.supervisor.name}</td>
                    <td className="border border-gray-300 px-4 py-2">
                      <span className={`px-2 py-1 rounded text-sm ${
                        typeof assignment.score === 'number' 
                          ? assignment.score >= 7 ? 'bg-green-100 text-green-800' 
                          : assignment.score >= 5 ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {assignment.score}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DissertationMatchingSystem;