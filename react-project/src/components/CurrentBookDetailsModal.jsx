import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context';
import { FiX, FiCalendar, FiClock, FiEdit2, FiTrash2, FiBook, FiBarChart2 } from 'react-icons/fi';

const GATEWAY_URL = 'http://localhost:3000';

const CurrentBookDetailsModal = ({ bookClubId, currentBookData, onClose, onBookUpdated, onBookRemoved }) => {
  const { auth } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('details'); // 'details', 'schedule', 'progress'
  
  // Schedule editing state
  const [editingSchedule, setEditingSchedule] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [readingDays, setReadingDays] = useState(30);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (currentBookData?.startDate) {
      setStartDate(new Date(currentBookData.startDate).toISOString().split('T')[0]);
    }
    if (currentBookData?.endDate) {
      setEndDate(new Date(currentBookData.endDate).toISOString().split('T')[0]);
    }
    if (currentBookData?.startDate && currentBookData?.endDate) {
      const start = new Date(currentBookData.startDate);
      const end = new Date(currentBookData.endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setReadingDays(diffDays);
    }
  }, [currentBookData]);

  // Auto-calculate end date when start date or reading days change
  useEffect(() => {
    if (startDate && readingDays > 0 && editingSchedule) {
      const start = new Date(startDate);
      const end = new Date(start);
      end.setDate(end.getDate() + readingDays);
      setEndDate(end.toISOString().split('T')[0]);
    }
  }, [startDate, readingDays, editingSchedule]);

  const calculateDaysRemaining = () => {
    if (!currentBookData?.endDate) return 0;
    const today = new Date();
    const end = new Date(currentBookData.endDate);
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const calculateProgress = () => {
    if (!currentBookData?.startDate || !currentBookData?.endDate) return 0;
    const start = new Date(currentBookData.startDate);
    const end = new Date(currentBookData.endDate);
    const today = new Date();
    const total = end - start;
    const elapsed = today - start;
    const percentage = Math.min(100, Math.max(0, (elapsed / total) * 100));
    return Math.round(percentage);
  };

  const calculatePagesPerDay = () => {
    if (!currentBookData?.book?.pageCount || !readingDays || readingDays === 0) return 0;
    return Math.ceil(currentBookData.book.pageCount / readingDays);
  };

  const handleUpdateSchedule = async () => {
    if (!startDate || !endDate) return;

    setSubmitting(true);
    try {
      const response = await fetch(
        `${GATEWAY_URL}/v1/bookclub/${currentBookData.bookClubId}/books/${currentBookData.bookId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${auth.token}`
          },
          body: JSON.stringify({
            startDate,
            endDate
          })
        }
      );

      const data = await response.json();
      if (response.ok && data.success) {
        onBookUpdated(data.data);
        setEditingSchedule(false);
        alert('Schedule updated successfully!');
      } else {
        alert(data.error || 'Failed to update schedule');
      }
    } catch (err) {
      console.error('Error updating schedule:', err);
      alert('Failed to update schedule');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveBook = async () => {
    if (!confirm('Are you sure you want to remove this book as the current reading?')) return;

    setSubmitting(true);
    try {
      const response = await fetch(
        `${GATEWAY_URL}/v1/bookclub/${currentBookData.bookClubId}/books/${currentBookData.bookId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${auth.token}`
          }
        }
      );

      const data = await response.json();
      if (response.ok && data.success) {
        onBookRemoved();
        onClose();
      } else {
        alert(data.error || 'Failed to remove book');
      }
    } catch (err) {
      console.error('Error removing book:', err);
      alert('Failed to remove book');
    } finally {
      setSubmitting(false);
    }
  };

  const book = currentBookData?.book;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <h2 className="text-2xl font-bold">📖 Current Book</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b bg-gray-50">
          <button
            onClick={() => setActiveTab('details')}
            className={`flex-1 px-6 py-3 font-medium transition-colors ${
              activeTab === 'details'
                ? 'bg-white text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <FiBook className="inline mr-2" size={18} />
            Details
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex-1 px-6 py-3 font-medium transition-colors ${
              activeTab === 'schedule'
                ? 'bg-white text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <FiCalendar className="inline mr-2" size={18} />
            Schedule
          </button>
          <button
            onClick={() => setActiveTab('progress')}
            className={`flex-1 px-6 py-3 font-medium transition-colors ${
              activeTab === 'progress'
                ? 'bg-white text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <FiBarChart2 className="inline mr-2" size={18} />
            Progress
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* DETAILS TAB */}
          {activeTab === 'details' && (
            <div className="max-w-3xl mx-auto">
              {/* Book Info */}
              <div className="flex gap-6 mb-6">
                <img
                  src={book?.coverUrl || '/images/default.webp'}
                  alt={book?.title}
                  className="w-48 h-72 object-cover rounded-lg shadow-lg"
                  onError={(e) => { e.target.src = '/images/default.webp'; }}
                />
                <div className="flex-1">
                  <h3 className="text-3xl font-bold text-gray-900 mb-3">
                    {book?.title}
                  </h3>
                  <p className="text-xl text-gray-600 mb-4">{book?.author}</p>
                  
                  <div className="space-y-2 text-gray-700">
                    {book?.pageCount && (
                      <p><span className="font-semibold">Pages:</span> {book.pageCount}</p>
                    )}
                    {book?.publishedDate && (
                      <p><span className="font-semibold">Published:</span> {book.publishedDate}</p>
                    )}
                    {book?.isbn && (
                      <p><span className="font-semibold">ISBN:</span> {book.isbn}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              {book?.description && (
                <div className="mb-6">
                  <h4 className="text-xl font-semibold text-gray-900 mb-3">About this book</h4>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {book.description}
                  </p>
                </div>
              )}

              {/* Reading Timeline */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Reading Timeline</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Started</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(currentBookData.startDate).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Target Completion</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(currentBookData.endDate).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SCHEDULE TAB */}
          {activeTab === 'schedule' && (
            <div className="max-w-2xl mx-auto">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold text-gray-900">Reading Schedule</h3>
                  {!editingSchedule && (
                    <button
                      onClick={() => setEditingSchedule(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <FiEdit2 size={16} />
                      Edit Schedule
                    </button>
                  )}
                </div>

                {editingSchedule ? (
                  <div className="space-y-6 bg-gray-50 p-6 rounded-lg">
                    {/* Start Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FiCalendar className="inline mr-2" />
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                      />
                    </div>

                    {/* Reading Duration */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FiClock className="inline mr-2" />
                        Reading Duration (days)
                      </label>
                      <div className="flex gap-4 items-center">
                        <input
                          type="range"
                          min="7"
                          max="90"
                          value={readingDays}
                          onChange={(e) => setReadingDays(parseInt(e.target.value))}
                          className="flex-1"
                        />
                        <input
                          type="number"
                          min="7"
                          max="90"
                          value={readingDays}
                          onChange={(e) => setReadingDays(parseInt(e.target.value))}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                      </div>
                    </div>

                    {/* End Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Target Completion Date
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => setEditingSchedule(false)}
                        className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleUpdateSchedule}
                        disabled={submitting || !startDate || !endDate}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                      >
                        {submitting ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6">
                    <div className="grid grid-cols-2 gap-6 mb-6">
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Start Date</p>
                        <p className="text-xl font-semibold text-gray-900">
                          {new Date(currentBookData.startDate).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-2">End Date</p>
                        <p className="text-xl font-semibold text-gray-900">
                          {new Date(currentBookData.endDate).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>

                    {book?.pageCount && (
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-purple-200">
                        <div className="text-center">
                          <p className="text-3xl font-bold text-purple-600">
                            {calculatePagesPerDay()}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">Pages per day</p>
                        </div>
                        <div className="text-center">
                          <p className="text-3xl font-bold text-blue-600">
                            {calculateDaysRemaining()}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">Days remaining</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PROGRESS TAB */}
          {activeTab === 'progress' && (
            <div className="max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Reading Progress</h3>
              
              {/* Overall Progress */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">Time Progress</h4>
                  <span className="text-3xl font-bold text-purple-600">{calculateProgress()}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-4 rounded-full transition-all"
                    style={{ width: `${calculateProgress()}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600">
                  {calculateDaysRemaining()} days remaining until target completion
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border-2 border-purple-200 rounded-lg p-6 text-center">
                  <p className="text-4xl font-bold text-purple-600 mb-2">
                    {new Date(currentBookData.startDate).toLocaleDateString('en-US', { day: 'numeric' })}
                  </p>
                  <p className="text-sm text-gray-600">
                    Started {new Date(currentBookData.startDate).toLocaleDateString('en-US', { month: 'short' })}
                  </p>
                </div>

                <div className="bg-white border-2 border-blue-200 rounded-lg p-6 text-center">
                  <p className="text-4xl font-bold text-blue-600 mb-2">
                    {new Date(currentBookData.endDate).toLocaleDateString('en-US', { day: 'numeric' })}
                  </p>
                  <p className="text-sm text-gray-600">
                    Due {new Date(currentBookData.endDate).toLocaleDateString('en-US', { month: 'short' })}
                  </p>
                </div>

                {book?.pageCount && (
                  <>
                    <div className="bg-white border-2 border-purple-200 rounded-lg p-6 text-center">
                      <p className="text-4xl font-bold text-purple-600 mb-2">
                        {book.pageCount}
                      </p>
                      <p className="text-sm text-gray-600">Total pages</p>
                    </div>

                    <div className="bg-white border-2 border-blue-200 rounded-lg p-6 text-center">
                      <p className="text-4xl font-bold text-blue-600 mb-2">
                        {calculatePagesPerDay()}
                      </p>
                      <p className="text-sm text-gray-600">Pages per day</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t bg-gray-50 px-6 py-4 flex justify-between items-center">
          <button
            onClick={handleRemoveBook}
            disabled={submitting}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            <FiTrash2 size={16} />
            Remove Book
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CurrentBookDetailsModal;
