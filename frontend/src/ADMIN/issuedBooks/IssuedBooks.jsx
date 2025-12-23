import React, { useState, useEffect } from 'react'

import axios from 'axios'
import { backend_server } from '../../config'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'

const IssuedBooks = () => {
  const NOT_RETURNED_API = `${backend_server}/api/v1/requestBooks/notreturnedbooks`
  const UPDATE_API = `${backend_server}/api/v1/requestBooks`

  const [notReturnedBooks, setNotReturnedBooks] = useState([])
  const [isAnyBooksIssued, setIsAnyBooksIssued] = useState(false)

  const fetchNotReturnedBooks = async () => {
    try {
      const response = await axios.get(NOT_RETURNED_API)
      setNotReturnedBooks(response.data.data)

      if (response.data.data && response.data.data.length > 0) {
        setIsAnyBooksIssued(true)
      } else {
        setIsAnyBooksIssued(false)
      }
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    fetchNotReturnedBooks()
  }, [])

  const handleReturn = async (transactionId) => {
    try {
      await axios.patch(UPDATE_API, {
        id: transactionId,
        isReturned: true,
      })
      toast.success('Book marked as returned!')
      fetchNotReturnedBooks() // Refresh the list
    } catch (error) {
      console.log(error)
      toast.error('Failed to update status.')
    }
  }

  return (
    <div className='container mt-2'>
      <h1 className='h1 text-center'>Issued Books</h1>

      {isAnyBooksIssued ? (
        <div className='row mt-3'>
          <table className='table table-hover'>
            <thead>
              <tr>
                <th scope='col'>#</th>
                <th scope='col'>Book</th>
                <th scope='col'>Email</th>
                <th scope='col'>Issue Date</th>
                <th scope='col'>Return Due</th>
                <th scope='col'>Return Status</th>
                <th scope='col'>Action</th>
              </tr>
            </thead>

            <tbody>
              {notReturnedBooks.map((book, index) => {
                const {
                  _id,
                  userEmail,
                  bookTitle,
                  isReturned,
                  returnDate,
                  issueDate,
                } = book

                return (
                  <tr key={_id}>
                    <th scope='row'>{index + 1}</th>
                    <td>{bookTitle}</td>
                    <td>{userEmail}</td>
                    <td>{new Date(issueDate).toDateString()}</td>
                    <td>{new Date(returnDate).toDateString()}</td>
                    <td>{isReturned ? 'Returned' : 'Not Returned'}</td>
                    <td>
                      {!isReturned && (
                        <button
                          className='btn btn-info'
                          onClick={() => handleReturn(_id)}
                        >
                          Mark as Returned
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className='p text-center my-3'>No Issued Books Yet</p>
      )}
    </div>
  )
}

export default IssuedBooks
