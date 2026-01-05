import { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'

export function useSubmissionId() {
  const [submissionId, setSubmissionId] = useState<string>('')

  useEffect(() => {
    // Check if submission_id exists in localStorage
    let existingId = localStorage.getItem('intake_submission_id')
    
    if (!existingId) {
      // Create new submission_id if doesn't exist
      existingId = uuidv4()
      localStorage.setItem('intake_submission_id', existingId)
    }
    
    setSubmissionId(existingId)
  }, [])

  const clearSubmissionId = () => {
    localStorage.removeItem('intake_submission_id')
    const newId = uuidv4()
    localStorage.setItem('intake_submission_id', newId)
    setSubmissionId(newId)
  }

  return { submissionId, clearSubmissionId }
}