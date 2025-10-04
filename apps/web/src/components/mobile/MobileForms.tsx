'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff, Check, X, ChevronDown, Calendar, Upload, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  rightIcon?: React.ReactNode;
  leftIcon?: React.ReactNode;
  onRightIconClick?: () => void;
  showCharacterCount?: boolean;
  maxLength?: number;
}

export const MobileInput: React.FC<MobileInputProps> = ({
  label,
  error,
  hint,
  rightIcon,
  leftIcon,
  onRightIconClick,
  showCharacterCount = false,
  maxLength,
  className = '',
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [value, setValue] = useState(props.value || '');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    props.onChange?.(e);
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-text-dark mb-2">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {leftIcon}
          </div>
        )}

        <input
          {...props}
          value={value}
          onChange={handleChange}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          className={`
            w-full px-4 py-3 text-base bg-white border rounded-lg
            transition-all duration-200 ease-in-out
            ${leftIcon ? 'pl-10' : ''}
            ${rightIcon ? 'pr-10' : ''}
            ${isFocused ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200'}
            ${error ? 'border-red-500 ring-2 ring-red-500/20' : ''}
            ${props.disabled ? 'bg-gray-50 text-gray-400' : ''}
            ${className}
          `}
          maxLength={maxLength}
        />

        {rightIcon && (
          <button
            type="button"
            onClick={onRightIconClick}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {rightIcon}
          </button>
        )}
      </div>

      <div className="mt-1 flex justify-between items-center">
        <div>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-red-500"
            >
              {error}
            </motion.p>
          )}
          {hint && !error && (
            <p className="text-sm text-gray-500">{hint}</p>
          )}
        </div>

        {showCharacterCount && maxLength && (
          <p className="text-sm text-gray-400">
            {String(value).length}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
};

export const MobilePasswordInput: React.FC<Omit<MobileInputProps, 'type' | 'rightIcon'>> = (props) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <MobileInput
      {...props}
      type={showPassword ? 'text' : 'password'}
      rightIcon={showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
      onRightIconClick={() => setShowPassword(!showPassword)}
    />
  );
};

interface MobileTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  showCharacterCount?: boolean;
  maxLength?: number;
  autoResize?: boolean;
}

export const MobileTextarea: React.FC<MobileTextareaProps> = ({
  label,
  error,
  hint,
  showCharacterCount = false,
  maxLength,
  autoResize = true,
  className = '',
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [value, setValue] = useState(props.value || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    props.onChange?.(e);

    if (autoResize && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  };

  useEffect(() => {
    if (autoResize && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [autoResize]);

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-text-dark mb-2">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <textarea
          {...props}
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          className={`
            w-full px-4 py-3 text-base bg-white border rounded-lg resize-none
            transition-all duration-200 ease-in-out min-h-[120px]
            ${isFocused ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200'}
            ${error ? 'border-red-500 ring-2 ring-red-500/20' : ''}
            ${props.disabled ? 'bg-gray-50 text-gray-400' : ''}
            ${className}
          `}
          maxLength={maxLength}
        />
      </div>

      <div className="mt-1 flex justify-between items-center">
        <div>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-red-500"
            >
              {error}
            </motion.p>
          )}
          {hint && !error && (
            <p className="text-sm text-gray-500">{hint}</p>
          )}
        </div>

        {showCharacterCount && maxLength && (
          <p className="text-sm text-gray-400">
            {String(value).length}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
};

interface MobileSelectProps {
  label?: string;
  error?: string;
  hint?: string;
  placeholder?: string;
  options: Array<{ value: string; label: string; description?: string }>;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
}

export const MobileSelect: React.FC<MobileSelectProps> = ({
  label,
  error,
  hint,
  placeholder = 'Select an option',
  options,
  value,
  onChange,
  disabled = false,
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(option => option.value === value);

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-text-dark mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`
            w-full px-4 py-3 text-base bg-white border rounded-lg text-left
            flex items-center justify-between transition-all duration-200
            ${isOpen ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200'}
            ${error ? 'border-red-500 ring-2 ring-red-500/20' : ''}
            ${disabled ? 'bg-gray-50 text-gray-400' : ''}
          `}
        >
          <span className={selectedOption ? 'text-text-dark' : 'text-gray-400'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
            >
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange?.(option.value);
                    setIsOpen(false);
                  }}
                  className={`
                    w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors
                    ${value === option.value ? 'bg-primary/10 text-primary' : 'text-text-dark'}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{option.label}</div>
                      {option.description && (
                        <div className="text-sm text-gray-500 mt-1">{option.description}</div>
                      )}
                    </div>
                    {value === option.value && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Overlay to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className="mt-1">
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-500"
          >
            {error}
          </motion.p>
        )}
        {hint && !error && (
          <p className="text-sm text-gray-500">{hint}</p>
        )}
      </div>
    </div>
  );
};

export const MobileDateInput: React.FC<Omit<MobileInputProps, 'type' | 'rightIcon'> & {
  dateFormat?: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
}> = ({ dateFormat = 'DD/MM/YYYY', ...props }) => {
  return (
    <MobileInput
      {...props}
      type="date"
      rightIcon={<Calendar className="w-5 h-5" />}
    />
  );
};

interface MobileFileUploadProps {
  label?: string;
  error?: string;
  hint?: string;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in MB
  onFileSelect?: (files: FileList | null) => void;
  disabled?: boolean;
  required?: boolean;
}

export const MobileFileUpload: React.FC<MobileFileUploadProps> = ({
  label,
  error,
  hint,
  accept,
  multiple = false,
  maxSize = 10,
  onFileSelect,
  disabled = false,
  required = false
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files);
      setSelectedFiles(fileArray);
      onFileSelect?.(files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      setSelectedFiles(Array.from(files));
      onFileSelect?.(files);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-text-dark mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${isDragOver ? 'border-primary bg-primary/5' : 'border-gray-300'}
          ${error ? 'border-red-500' : ''}
          ${disabled ? 'bg-gray-50' : 'cursor-pointer hover:border-primary hover:bg-primary/5'}
        `}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
          disabled={disabled}
          className="hidden"
        />

        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-4" />

        <p className="text-base font-medium text-text-dark mb-2">
          {selectedFiles.length > 0 ? 'Files selected' : 'Upload files'}
        </p>

        <p className="text-sm text-gray-500">
          Tap to browse or drag and drop
        </p>

        <p className="text-xs text-gray-400 mt-2">
          Max file size: {maxSize}MB
        </p>
      </div>

      {/* Selected files list */}
      {selectedFiles.length > 0 && (
        <div className="mt-3 space-y-2">
          {selectedFiles.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <p className="text-sm font-medium text-text-dark truncate">{file.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const newFiles = selectedFiles.filter((_, i) => i !== index);
                  setSelectedFiles(newFiles);
                  // Reset file input
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className="p-1 text-gray-400 hover:text-red-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-1">
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-500"
          >
            {error}
          </motion.p>
        )}
        {hint && !error && (
          <p className="text-sm text-gray-500">{hint}</p>
        )}
      </div>
    </div>
  );
};

interface MobileVoiceInputProps {
  label?: string;
  error?: string;
  hint?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onVoiceResult?: (transcript: string) => void;
  disabled?: boolean;
  required?: boolean;
}

export const MobileVoiceInput: React.FC<MobileVoiceInputProps> = ({
  label,
  error,
  hint,
  placeholder = 'Type or speak your message',
  value,
  onChange,
  onVoiceResult,
  disabled = false,
  required = false
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  const startListening = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const result = event.results[0][0].transcript;
        setTranscript(result);
        onChange?.(result);
        onVoiceResult?.(result);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } else {
      alert('Speech recognition is not supported in your browser');
    }
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-text-dark mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <MobileTextarea
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          error={error}
          className="pr-12"
        />

        <button
          type="button"
          onClick={startListening}
          disabled={disabled || isListening}
          className={`
            absolute bottom-3 right-3 p-2 rounded-full transition-colors
            ${isListening
              ? 'bg-red-500 text-white animate-pulse'
              : 'bg-primary text-white hover:bg-primary/80'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {isListening ? (
            <MicOff className="w-4 h-4" />
          ) : (
            <Mic className="w-4 h-4" />
          )}
        </button>
      </div>

      {hint && !error && (
        <p className="text-sm text-gray-500 mt-1">{hint}</p>
      )}

      {isListening && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg"
        >
          <p className="text-sm text-red-600 text-center">
            🎤 Listening... Speak clearly into your device
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default {
  MobileInput,
  MobilePasswordInput,
  MobileTextarea,
  MobileSelect,
  MobileDateInput,
  MobileFileUpload,
  MobileVoiceInput
};