import React, { useState } from 'react';
import { X, Star, Send, ThumbsUp } from 'lucide-react';

interface FeedbackPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const FeedbackPopup: React.FC<FeedbackPopupProps> = ({ isOpen, onClose }) => {
  const [rating, setRating] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would send this data to a server
    console.log('Feedback submitted:', { rating, feedback });
    setSubmitted(true);
    
    // Reset form after 3 seconds and close
    setTimeout(() => {
      setRating(0);
      setFeedback('');
      setSubmitted(false);
      onClose();
    }, 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Share Your Feedback</h3>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        {submitted ? (
          <div className="text-center py-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <ThumbsUp size={32} className="text-green-600" />
            </div>
            <p className="text-lg font-medium mb-2">Thank You!</p>
            <p className="text-gray-600">Your feedback has been submitted successfully.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-gray-700 mb-2">How would you rate your experience?</label>
              <div className="flex justify-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none"
                  >
                    <Star
                      size={32}
                      className={`${
                        rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                      } hover:text-yellow-400 transition-colors`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label htmlFor="feedback" className="block text-gray-700 mb-2">
                Tell us about your experience (optional)
              </label>
              <textarea
                id="feedback"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="What did you like? What could be improved?"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={rating === 0}
              className={`w-full py-2 px-4 rounded-md flex items-center justify-center ${
                rating === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <Send size={18} className="mr-2" />
              Submit Feedback
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default FeedbackPopup;
