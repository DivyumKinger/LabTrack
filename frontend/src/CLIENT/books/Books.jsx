import React, { useEffect, useState } from 'react'
import axios from 'axios'
import CustomPagination from '../pagination/CustomPagination'
import SmallBanner from '../bannerHome/SmallBanner'
import PopularBooks from './PopularBooks'
import { backend_server } from '../../config'
import BrowseCollectionBooks from './BrowseCollectionBooks'
import { Toaster } from 'react-hot-toast'
import FilterBooksForm from './FilterBooksForm'
import useFetch from '../../useFetch'

const Books = () => {
  const API_URL = `${backend_server}/api/v1/book/`

  const [bookData, setBookData] = useState([])
  const [page, setPage] = useState(1)
  const [showCacheStatus, setShowCacheStatus] = useState(false)

  // Use the useFetch hook
  const { fetched_data, loading, cacheStatus } = useFetch(
    `${API_URL}?page=${page}`
  )

  // If 0 results then display false , true = results found , false = 0 search results
  const [searchResult, setSearchResult] = useState(true)

  // if filterForm is active , disbale pagination else allow paginations
  const [filterActive, setFilterActive] = useState(false)

  // Update bookData when fetched_data changes (and filter is not active)
  useEffect(() => {
    if (!filterActive && fetched_data && fetched_data.data) {
      setBookData(fetched_data.data)
    }
  }, [fetched_data, filterActive])

  // Hide cache status after 2 seconds
  useEffect(() => {
    if (cacheStatus) {
      setShowCacheStatus(true)
      const timer = setTimeout(() => {
        setShowCacheStatus(false)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [cacheStatus])

  // Function to handle page changes from pagination
  const handlePageChange = (pageNumber) => {
    setPage(pageNumber)
  }

  return (
    <div className='container'>
      {/* Cache Status Display */}
      {showCacheStatus && cacheStatus && (
        <div
          style={{
            position: 'fixed',
            top: '10px',
            right: '10px',
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '10px',
            borderRadius: '5px',
            zIndex: 9999,
            transition: 'opacity 0.5s ease-in-out',
          }}
        >
          Cache Status: <strong>{cacheStatus}</strong>
        </div>
      )}

      {/* Popular Books Heading */}
      <div className='row'>
        <h1 className='h1 mt-3' style={{ textAlign: 'center' }}>
          Popular Books
        </h1>

        {/* Popular Books */}
        <PopularBooks></PopularBooks>
      </div>

      {/* Into the Wild Banner */}
      <SmallBanner></SmallBanner>

      <div className='col mt-5 '>
        {/* Browse Collections HEADING */}
        <h1 className='h1' style={{ textAlign: 'center' }}>
          Browse Collections
        </h1>

        <div className='mt-1'>
          {/* FILTER BOOKS SECTION */}
          <FilterBooksForm
            setBookData={setBookData}
            setSearchResult={setSearchResult}
            setFilterActive={setFilterActive}
          ></FilterBooksForm>
        </div>

        {/* BROWSE COLLECTIONS BOOKS */}
        <BrowseCollectionBooks
          bookData={bookData}
          searchResult={searchResult}
        ></BrowseCollectionBooks>

        {/* Pagination */}
        <div className='my-3 d-flex justify-content-center'>
          <CustomPagination
            fetchData={handlePageChange}
            filterActive={filterActive}
          ></CustomPagination>
        </div>
      </div>
    </div>
  )
}

export default Books
