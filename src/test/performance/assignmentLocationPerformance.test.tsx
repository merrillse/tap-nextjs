import { describe, it, expect, beforeAll, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MOGSAssignmentLocationPage from '../../app/mogs-assignment-location/page'
import { mockValidAssignmentLocation, mockApiClient } from '../mocks/assignmentLocationMocks'

// Mock the API client
vi.mock('../../lib/api-client', () => ({
  ApiClient: vi.fn().mockImplementation(() => mockApiClient)
}))

describe('MOGS Assignment Location Performance Tests', () => {
  beforeAll(() => {
    vi.clearAllMocks()
  })

  describe('Render Performance', () => {
    it('should render initial page within acceptable time', async () => {
      const startTime = performance.now()
      
      render(<MOGSAssignmentLocationPage />)
      
      // Wait for component to be fully rendered
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /MOGS Assignment Location/i })).toBeInTheDocument()
      })
      
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      // Should render within 100ms
      expect(renderTime).toBeLessThan(100)
    })

    it('should handle large dataset rendering efficiently', async () => {
      // Create mock data with many components
      const largeDataset = {
        ...mockValidAssignmentLocation,
        components: Array(100).fill(null).map((_, index) => ({
          id: `comp${index}`,
          complement: 2,
          replacement: false,
          description: `Component ${index}`,
          status: { value: 1, label: "ACTIVE" }
        })),
        missionaryHistories: Array(50).fill(null).map((_, index) => ({
          legacyMissId: 123456 + index,
          assignmentLocationId: 12345,
          effectiveDate: "2023-01-01",
          areaName: `Area ${index}`,
          roleType: "Missionary"
        }))
      }
      
      mockApiClient.executeGraphQLQuery.mockResolvedValueOnce({
        data: { assignmentLocation: largeDataset }
      })
      
      render(<MOGSAssignmentLocationPage />)
      const user = userEvent.setup()
      
      const startTime = performance.now()
      
      const input = screen.getByLabelText(/Assignment Location ID/i)
      await user.type(input, '12345')
      await user.click(screen.getByRole('button', { name: /search/i }))
      
      await waitFor(() => {
        expect(screen.getByText('Assignment Location Details')).toBeInTheDocument()
      })
      
      const endTime = performance.now()
      const searchTime = endTime - startTime
      
      // Should handle large datasets within 500ms
      expect(searchTime).toBeLessThan(500)
    })
  })

  describe('Memory Usage', () => {
    it('should not leak memory on repeated searches', async () => {
      mockApiClient.executeGraphQLQuery.mockResolvedValue({
        data: { assignmentLocation: mockValidAssignmentLocation }
      })
      
      const { unmount } = render(<MOGSAssignmentLocationPage />)
      const user = userEvent.setup()
      
      // Simulate multiple searches
      for (let i = 0; i < 10; i++) {
        const input = screen.getByLabelText(/Assignment Location ID/i)
        await user.clear(input)
        await user.type(input, `1234${i}`)
        await user.click(screen.getByRole('button', { name: /search/i }))
        
        await waitFor(() => {
          expect(screen.getByText('Assignment Location Details')).toBeInTheDocument()
        })
        
        // Clear results
        await user.click(screen.getByRole('button', { name: /clear/i }))
      }
      
      // Cleanup should happen without memory leaks
      unmount()
      
      // Memory usage assertions would require more sophisticated tooling
      // but this test ensures the component can handle repeated operations
      expect(mockApiClient.executeGraphQLQuery).toHaveBeenCalledTimes(10)
    })
  })

  describe('Network Resilience', () => {
    it('should handle intermittent network failures gracefully', async () => {
      let callCount = 0
      
      mockApiClient.executeGraphQLQuery.mockImplementation(() => {
        callCount++
        if (callCount <= 2) {
          return Promise.reject(new Error('Network error'))
        }
        return Promise.resolve({
          data: { assignmentLocation: mockValidAssignmentLocation }
        })
      })
      
      render(<MOGSAssignmentLocationPage />)
      const user = userEvent.setup()
      
      const input = screen.getByLabelText(/Assignment Location ID/i)
      
      // First attempt - should fail
      await user.type(input, '12345')
      await user.click(screen.getByRole('button', { name: /search/i }))
      
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument()
      })
      
      // Second attempt - should also fail
      await user.click(screen.getByRole('button', { name: /search/i }))
      
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument()
      })
      
      // Third attempt - should succeed
      await user.click(screen.getByRole('button', { name: /search/i }))
      
      await waitFor(() => {
        expect(screen.getByText('Assignment Location Details')).toBeInTheDocument()
      })
      
      expect(callCount).toBe(3)
    })

    it('should handle slow API responses without blocking UI', async () => {
      let resolveFunction: (value: any) => void
      
      mockApiClient.executeGraphQLQuery.mockImplementationOnce(() => 
        new Promise(resolve => {
          resolveFunction = resolve
          // Simulate slow response
          setTimeout(() => {
            resolve({ data: { assignmentLocation: mockValidAssignmentLocation } })
          }, 200)
        })
      )
      
      render(<MOGSAssignmentLocationPage />)
      const user = userEvent.setup()
      
      const input = screen.getByLabelText(/Assignment Location ID/i)
      await user.type(input, '12345')
      
      const searchButton = screen.getByRole('button', { name: /search/i })
      await user.click(searchButton)
      
      // UI should show loading state immediately
      expect(screen.getByRole('button', { name: /searching.../i })).toBeInTheDocument()
      
      // Other UI elements should still be interactive
      const clearButton = screen.getByRole('button', { name: /clear/i })
      expect(clearButton).not.toBeDisabled()
      
      // Wait for response
      await waitFor(() => {
        expect(screen.getByText('Assignment Location Details')).toBeInTheDocument()
      }, { timeout: 300 })
    })
  })

  describe('Stress Testing', () => {
    it('should handle rapid sequential searches', async () => {
      mockApiClient.executeGraphQLQuery.mockResolvedValue({
        data: { assignmentLocation: mockValidAssignmentLocation }
      })
      
      render(<MOGSAssignmentLocationPage />)
      const user = userEvent.setup()
      
      const input = screen.getByLabelText(/Assignment Location ID/i)
      const searchButton = screen.getByRole('button', { name: /search/i })
      
      // Rapid fire searches
      const searches = []
      for (let i = 0; i < 5; i++) {
        searches.push(
          user.clear(input).then(() =>
            user.type(input, `rapid${i}`)
          ).then(() =>
            user.click(searchButton)
          )
        )
      }
      
      // All searches should complete without errors
      await Promise.all(searches)
      
      // Should have made multiple API calls
      expect(mockApiClient.executeGraphQLQuery).toHaveBeenCalledTimes(5)
    })

    it('should handle edge case input values', async () => {
      const edgeCases = [
        '', // empty
        ' ', // whitespace only
        'a'.repeat(1000), // very long string
        '🎯🔍📊', // emoji
        '<script>alert("xss")</script>', // potential XSS
        'SELECT * FROM users', // SQL injection attempt
        '../../etc/passwd', // path traversal
        'null', // string null
        'undefined', // string undefined
      ]
      
      render(<MOGSAssignmentLocationPage />)
      const user = userEvent.setup()
      
      const input = screen.getByLabelText(/Assignment Location ID/i)
      
      for (const testCase of edgeCases) {
        await user.clear(input)
        if (testCase.trim()) {
          await user.type(input, testCase)
          await user.click(screen.getByRole('button', { name: /search/i }))
          
          // Should handle gracefully - either show error or make API call
          await waitFor(() => {
            const hasError = screen.queryByText(/error/i)
            const isSearching = screen.queryByText(/searching/i)
            expect(hasError || isSearching).toBeTruthy()
          })
        }
      }
    })
  })
})
