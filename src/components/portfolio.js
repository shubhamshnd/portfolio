'use client';

import React, { useState, useEffect } from 'react';
// Add these imports at the top of your file
import { ChevronRight, ChevronDown, File, Folder, Github, Linkedin, Twitter, 
  Mail, Download, ExternalLink, X, Play, FileText, AlertCircle, Menu, 
  CheckCircle2, Loader2 } from 'lucide-react';

import { projectsData, experienceData, certificationsData, educationData, contactPythonCode } from '@/data/portfolio-data';

const Portfolio = () => {
  const [expandedFolders, setExpandedFolders] = useState({
    portfolio: true,
    projects: false,
    experience: false,
    education: false,
    certifications: false
  });

  const [editableValues, setEditableValues] = useState({
    name: "### ENTER YOUR NAME ###",
    email: "### ENTER YOUR EMAIL ###",
    message: "### ENTER YOUR MESSAGE ###"
  });
  const [pdfData, setPdfData] = useState(null);
  const [formStatus, setFormStatus] = useState({
    loading: false,
    error: null,
    success: false,
    message: ''
  });
  // Load PDF file when component mounts
  useEffect(() => {
    const loadPdf = async () => {
      try {
        const response = await fetch('/shubham_resume.pdf');
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        setPdfData(new Uint8Array(arrayBuffer));
      } catch (error) {
        console.error('Error loading PDF:', error);
      }
    };
    loadPdf();
  }, []);
const [isSidebarOpen, setIsSidebarOpen] = useState(true);
const [isMobile, setIsMobile] = useState(false);
useEffect(() => {
  const checkMobile = () => {
    setIsMobile(window.innerWidth < 768);
    setIsSidebarOpen(window.innerWidth >= 768);
  };

  checkMobile();
  window.addEventListener('resize', checkMobile);
  return () => window.removeEventListener('resize', checkMobile);
}, []);
  
const StatusMessage = ({ type, message }) => {
  if (!message) return null;
  
  const styles = {
    success: "bg-green-500/10 text-green-500 border-green-500/20",
    error: "bg-red-500/10 text-red-500 border-red-500/20",
    loading: "bg-blue-500/10 text-blue-500 border-blue-500/20"
  };

  return (
    <div className={`flex items-center gap-2 p-2 my-2 border rounded ${styles[type]} max-w-full break-words`}>
      {type === 'success' && <CheckCircle2 size={16} className="flex-shrink-0" />}
      {type === 'error' && <AlertCircle size={16} className="flex-shrink-0" />}
      {type === 'loading' && <Loader2 size={16} className="animate-spin flex-shrink-0" />}
      <span className="text-sm">{message}</span>
    </div>
  );
};

// Optional: Add a mobile overlay component to close sidebar when clicking outside
const MobileOverlay = ({ isOpen, onClose }) => {
  if (!isOpen || window.innerWidth >= 768) return null;
  
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-0"
      onClick={onClose}
      aria-hidden="true"
    />
  );
};
  // Define initial content for each file
  const fileContents = {
    'welcome.md': "# Welcome to My Portfolio\n\nI'm a passionate software engineer with expertise in full-stack development and AI/ML.\n\nExplore my work by clicking on the files in the sidebar!",
    'projects.json': JSON.stringify(projectsData, null, 2),
    'experience.json': JSON.stringify(experienceData, null, 2),
    'education.json': JSON.stringify(educationData, null, 2),
    'certifications.json': JSON.stringify(certificationsData, null, 2),
    'contact.py': contactPythonCode,
    'resume.pdf': null
  };
  

  const [openTabs, setOpenTabs] = useState([
    {
      id: 'welcome.md',
      content: fileContents['welcome.md']
    }
  ]);
  
  const [activeTab, setActiveTab] = useState('welcome.md');

  const toggleFolder = (folder) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folder]: !prev[folder]
    }));
  };

  const getFileContent = (filename) => {
    // Handle projects.json with both open-source and enterprise projects
    if (filename === 'projects.json') {
      const projects = projectsData.projects.map(project => {
        if (project.type === 'open-source') {
          // Format for open-source projects
          return {
            name: project.name,
            description: project.description,
            technologies: project.technologies,
            preview: project.preview,
            links: project.github ? 
              `Links: [GitHub](${project.github})${project.demo ? ` | [Live Demo](${project.demo})` : ''}` :
              undefined
          };
        } else if (project.type === 'enterprise') {
          // Format for enterprise/private projects
          return {
            name: project.name,
            description: project.description,
            technologies: project.technologies,
            preview: project.preview,
            company: `Company: ${project.company}`,
            impact: [
              "Project Impact:",
              ...project.impact.map(item => `- ${item}`)
            ],
            note: "Note: This is a private enterprise project, source code is not publicly available."
          };
        }
        return project;
      });
  
      return JSON.stringify({ projects }, null, 2);
    }
    
    // Handle certifications.json
    else if (filename === 'certifications.json') {
      const certifications = certificationsData.certifications.map(cert => ({
        name: cert.name,
        issuer: cert.issuer,
        date: cert.date,
        description: cert.description,
        link: `[View Certificate](${cert.link})`
      }));
      return JSON.stringify({ certifications }, null, 2);
    }
    
    // Handle education.json
    else if (filename === 'education.json') {
      const education = educationData.education.map(edu => ({
        institution: edu.institution,
        degree: edu.degree,
        duration: edu.duration,
        location: edu.location,
        achievements: edu.achievements.map(achievement => `- ${achievement}`).join('\n')
      }));
      return JSON.stringify({ education }, null, 2);
    }
    
    // Handle experience.json
    else if (filename === 'experience.json') {
      const experience = experienceData.experience.map(exp => ({
        company: exp.company,
        position: exp.position,
        duration: exp.duration,
        description: exp.description
      }));
      return JSON.stringify({ experience }, null, 2);
    }
    
    // Handle welcome.md and contact.py
    else if (filename === 'welcome.md' || filename === 'contact.py') {
      return fileContents[filename] || '';
    }
    
    // Default case for any other files
    return fileContents[filename] || 'File content not found';
  };
  
  
// Modify the handleFileClick function
const handleFileClick = (file) => {
  if (file === 'resume.pdf') {
    if (!openTabs.find(tab => tab.id === file)) {
      setOpenTabs(prev => [...prev, { id: file, content: null }]);
    }
    setActiveTab(file);
  } else {
    if (!openTabs.find(tab => tab.id === file)) {
      const content = getFileContent(file);
      setOpenTabs(prev => [...prev, { id: file, content }]);
    }
    setActiveTab(file);
  }
  // Close sidebar on mobile after file selection
  if (window.innerWidth < 768) {
    setIsSidebarOpen(false);
  }
};

  const renderContent = () => {
    if (activeTab === 'resume.pdf' && pdfData) {
      const blob = new Blob([pdfData], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-900">
          <iframe
            src={url}
            className="w-full h-full"
            title="Resume PDF"
          />
        </div>
      );
    }
  
    const activeContent = openTabs.find(tab => tab.id === activeTab)?.content;
    if (!activeContent) return null;
  
    return (
      <pre className="font-mono text-sm">
        <code className="block p-4">
          {activeContent.split('\n').map((line, index) => (
            <div key={index} className="group flex">
              {renderLineNumber(index)}
              <div className="flex-1 pl-4 break-words whitespace-pre-wrap py-0.5">
                {renderLineWithHighlighting(line)}
              </div>
            </div>
          ))}
        </code>
      </pre>
    );
  };
  

  const closeTab = (tabId, e) => {
    e.stopPropagation();
    setOpenTabs(prev => prev.filter(tab => tab.id !== tabId));
    if (activeTab === tabId) {
      setActiveTab(openTabs.length > 1 ? openTabs[openTabs.length - 2].id : null);
    }
  };

  const handleSocialClick = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleLinkClick = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const downloadResume = () => {
    if (pdfData) {
      const blob = new Blob([pdfData], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'shubham_resume.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  };
  
  const handleCodeExecution = async () => {
    if (activeTab === 'contact.py') {
      // Reset status
      setFormStatus({
        loading: true,
        error: null,
        success: false,
        message: 'Sending message...'
      });
  
      // Validation
      if (
        editableValues.name === "### ENTER YOUR NAME ###" ||
        editableValues.email === "### ENTER YOUR EMAIL ###" ||
        editableValues.message === "### ENTER YOUR MESSAGE ###"
      ) {
        setFormStatus({
          loading: false,
          error: true,
          success: false,
          message: 'Please fill in all fields before submitting.'
        });
        return;
      }
  
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editableValues.email)) {
        setFormStatus({
          loading: false,
          error: true,
          success: false,
          message: 'Please enter a valid email address.'
        });
        return;
      }
  
      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: editableValues.name,
            email: editableValues.email,
            message: editableValues.message
          })
        });
  
        let data;
        try {
          data = await response.json();
        } catch (e) {
          throw new Error('Invalid response from server');
        }
  
        if (!response.ok) {
          throw new Error(data.error || 'Failed to send message');
        }
  
        // Success
        setFormStatus({
          loading: false,
          error: false,
          success: true,
          message: 'Message sent successfully! Please check your email for confirmation.'
        });
  
        // Reset form
        setEditableValues({
          name: "### ENTER YOUR NAME ###",
          email: "### ENTER YOUR EMAIL ###",
          message: "### ENTER YOUR MESSAGE ###"
        });
  
      } catch (error) {
        setFormStatus({
          loading: false,
          error: true,
          success: false,
          message: error.message === 'Invalid response from server' 
            ? 'Server error. Please try again later.'
            : error.message || 'Failed to send message. Please try again.'
        });
      }
    }
  };

  const handleEditableClick = (type) => {
    const newValue = prompt(`Enter your ${type}:`, editableValues[type]);
    if (newValue) {
      setEditableValues(prev => ({
        ...prev,
        [type]: newValue
      }));
    }
  };

  const renderLineNumber = (index) => {
    const number = (index + 1).toString();
    return (
      <div className="sticky left-0 w-12 flex-none bg-gray-900 text-gray-500 select-none text-right pr-4 py-0.5">
        {number}
      </div>
    );
  };

const renderLineWithHighlighting = (line) => {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const editableAreas = [
    { placeholder: "### ENTER YOUR NAME ###", type: "name" },
    { placeholder: "### ENTER YOUR EMAIL ###", type: "email" },
    { placeholder: "### ENTER YOUR MESSAGE ###", type: "message" }
  ];

  // Add special styling for enterprise project notes
  if (line.includes('Note: This is a private enterprise project')) {
    return (
      <span className="text-yellow-500 italic break-words">
        {line}
      </span>
    );
  }

  // Add special styling for impact points
  if (line.trim().startsWith('"- ')) {
    return (
      <span className="text-green-400 break-words">
        {line}
      </span>
    );
  }

  if (line.trim().startsWith('"Company:')) {
    return (
      <span className="text-blue-400 font-semibold break-words">
        {line}
      </span>
    );
  }

  if (line.match(linkRegex)) {
    return (
      <span className="break-words">
        {line.split(linkRegex).map((part, index, array) => {
          if (index % 3 === 1) {
            return (
              <span
                key={index}
                className="text-blue-400 cursor-pointer hover:underline"
                onClick={() => handleLinkClick(array[index + 1])}
              >
                {part}
              </span>
            );
          } else if (index % 3 === 2) {
            return null;
          }
          return part;
        })}
      </span>
    );
  }

  for (const area of editableAreas) {
    if (line.includes(area.placeholder)) {
      return (
        <span className="break-words">
          {line.split(area.placeholder).map((part, index, array) => (
            <React.Fragment key={index}>
              {part}
              {index < array.length - 1 && (
                <span 
                  className="bg-blue-500 bg-opacity-20 px-1 cursor-pointer hover:bg-opacity-30"
                  onClick={() => handleEditableClick(area.type)}
                >
                  {editableValues[area.type]}
                </span>
              )}
            </React.Fragment>
          ))}
        </span>
      );
    }
  }
  return <span className="break-words">{line}</span>;
};

return (
  <div className="h-screen w-full flex flex-col bg-gray-900 text-gray-300 overflow-hidden">
    {/* Header */}
    <header className="h-auto md:h-16 flex-none bg-gray-800 p-4 flex flex-col md:flex-row justify-between items-center border-b border-gray-700 gap-4 md:gap-0">
      <div className="flex items-center w-full md:w-auto justify-between">
        <button 
          className="md:hidden p-2 hover:bg-gray-700 rounded-full"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          aria-label="Toggle menu"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-lg md:text-xl font-bold truncate">
          Shubham Shinde - Software Engineer
        </h1>
      </div>
      
      <div className="flex space-x-2 md:space-x-4 w-full md:w-auto justify-center md:justify-end">
        <button
          onClick={() => handleSocialClick('https://github.com/shubhamshnd')}
          className="p-2 hover:bg-gray-700 rounded-full transition-colors"
          title="GitHub"
        >
          <Github size={20} />
        </button>
        <button
          onClick={() => handleSocialClick('https://www.linkedin.com/in/shubham-shnd/')}
          className="p-2 hover:bg-gray-700 rounded-full transition-colors"
          title="LinkedIn"
        >
          <Linkedin size={20} />
        </button>
        <button
          onClick={() => handleSocialClick('https://x.com/shubhamshnd')}
          className="p-2 hover:bg-gray-700 rounded-full transition-colors"
          title="Twitter"
        >
          <Twitter size={20} />
        </button>
        <button
          onClick={() => handleSocialClick('mailto:shubhamshindesunil.work@gmail.com')}
          className="p-2 hover:bg-gray-700 rounded-full transition-colors"
          title="Email"
        >
          <Mail size={20} />
        </button>
        <button
          onClick={downloadResume}
          className="flex items-center px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
        >
          <Download size={16} className="mr-2" />
          <span className="hidden sm:inline">Resume</span>
        </button>
      </div>
    </header>

    {/* Main Content Area */}
    <div className="flex flex-1 overflow-hidden relative">
      {/* Mobile Overlay */}
{isSidebarOpen && isMobile && (
  <div 
    className="fixed inset-0 bg-black bg-opacity-50 z-0"
    onClick={() => setIsSidebarOpen(false)}
    aria-hidden="true"
  />
)}
      
      {/* Sidebar */}
      <aside 
        className={`absolute md:relative w-64 bg-gray-800 border-r border-gray-700 
          overflow-hidden transition-transform duration-300 h-full z-10
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <div className="h-full p-2">
          <div className="text-sm text-gray-500 mb-2">EXPLORER</div>
          <div>
            <div 
              className="flex items-center py-1 px-2 hover:bg-gray-700 cursor-pointer" 
              onClick={() => toggleFolder('portfolio')}
            >
              {expandedFolders.portfolio ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <Folder size={16} className="ml-1 mr-2" />
              <span className="truncate">portfolio-Final1111</span>
            </div>
            {expandedFolders.portfolio && (
              <div className="ml-4">
                {[
                  'welcome.md',
                  'projects.json',
                  'experience.json',
                  'education.json',
                  'certifications.json',
                  'contact.py',
                  'resume.pdf'
                ].map((file) => (
                  <div
                    key={file}
                    className={`flex items-center py-1 px-2 hover:bg-gray-700 cursor-pointer
                      ${activeTab === file ? 'bg-gray-700' : ''}`}
                    onClick={() => {
                      handleFileClick(file);
                      if (window.innerWidth < 768) {
                        setIsSidebarOpen(false);
                      }
                    }}
                  >
                    {file === 'resume.pdf' ? (
                      <FileText size={16} className="mr-2 flex-shrink-0" />
                    ) : (
                      <File size={16} className="mr-2 flex-shrink-0" />
                    )}
                    <span className="text-sm truncate">{file}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Editor Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Tab Bar */}
        <div className="h-auto md:h-9 flex-none bg-gray-800 px-2 flex flex-wrap items-center 
          justify-between border-b border-gray-700 gap-2">
          <div className="flex items-center space-x-2 overflow-x-auto max-w-full py-1 scrollbar-thin
            scrollbar-thumb-gray-600 scrollbar-track-transparent">
            {openTabs.map(tab => (
              <div
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-3 py-1 rounded-t cursor-pointer min-w-0 
                  ${activeTab === tab.id ? 'bg-gray-700' : 'bg-gray-800 hover:bg-gray-700'}`}
              >
                <span className="text-sm truncate max-w-[100px] sm:max-w-[200px]">{tab.id}</span>
                <button
                  onClick={(e) => closeTab(tab.id, e)}
                  className="ml-2 p-1 hover:bg-gray-600 rounded flex-shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          
          {activeTab === 'contact.py' && (
            <div className="relative flex items-center py-1">
              <button
                onClick={handleCodeExecution}
                disabled={formStatus.loading}
                className={`flex items-center px-3 py-1 rounded-md transition-colors 
                  ${formStatus.loading ? 'bg-gray-600 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700'}`}
              >
                {formStatus.loading ? (
                  <Loader2 size={16} className="mr-2 animate-spin" />
                ) : (
                  <Play size={16} className="mr-2" />
                )}
                {formStatus.loading ? 'Sending...' : 'Run'}
              </button>
              
              {formStatus.message && (
                <div className="absolute top-full right-0 mt-2 z-50 w-full sm:min-w-[200px]">
                  <StatusMessage 
                    type={formStatus.error ? 'error' : formStatus.loading ? 'loading' : 'success'} 
                    message={formStatus.message} 
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Code Area */}
        <div className="flex-1 relative bg-gray-900 overflow-auto">
          {activeTab && (
            <div className="absolute inset-0">
              {activeTab === 'resume.pdf' && pdfData ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-900">
                  <iframe
                    src={URL.createObjectURL(new Blob([pdfData], { type: 'application/pdf' }))}
                    className="w-full h-full"
                    title="Resume PDF"
                  />
                </div>
              ) : (
                <pre className="font-mono text-sm">
                  <code className="block p-4">
                    {openTabs
                      .find(tab => tab.id === activeTab)
                      ?.content.split('\n')
                      .map((line, index) => (
                        <div key={index} className="group flex min-w-0">
                          <div className="flex-none">
                            {renderLineNumber(index)}
                          </div>
                          <div className="flex-1 pl-4 break-words whitespace-pre-wrap py-0.5 
                            overflow-x-auto">
                            {renderLineWithHighlighting(line)}
                          </div>
                        </div>
                      ))}
                  </code>
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div className="h-6 flex-none bg-gray-800 px-4 py-1 text-xs md:text-sm flex 
          justify-between border-t border-gray-700">
          <div>Open Files: {openTabs.length}</div>
          <div className="truncate">Portfolio</div>
        </div>
      </main>
    </div>
  </div>
);
};

export default Portfolio;
