'use client'

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Cloud, CloudRain, MapPin, Star, Sun } from 'lucide-react'
import dynamic from 'next/dynamic'
import Link from "next/link"
import { useEffect, useState } from "react"
import { formatRating } from "@/lib/utils"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination"

// Dynamic import for map to avoid SSR issues
const MapComponent = dynamic(() => import('@/components/map-component'), { 
  ssr: false,
  loading: () => <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">Đang tải bản đồ...</div>
})

interface Court {
  _id: string
  name: string
  type: string
  address: string
  pricePerHour: number
  rating: number
  reviewCount: number
  images: string[]
  location: {
    coordinates: [string, string]
  }
  owner: {
    name: string
    phone: string
  }
}

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSport, setSelectedSport] = useState("all")
  const [selectedTime, setSelectedTime] = useState("all")
  const [courts, setCourts] = useState<Court[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const [weather, setWeather] = useState<any>(null)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [limit, setLimit] = useState(10)

  // Fetch courts from API
  useEffect(() => {
    fetchCourts()
  }, [selectedSport, searchQuery, page, limit])

  useEffect(() => {
    fetchWeather()
  }, [])

  // Reset to page 1 when filters/search change
  useEffect(() => {
    setPage(1)
  }, [selectedSport, searchQuery])

  const fetchCourts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (selectedSport !== 'all') {
        params.append('type', selectedSport)
      }
      if (searchQuery) {
        params.append('search', searchQuery)
      }
      params.append('page', String(page))
      params.append('limit', String(limit))

      const response = await fetch(`/api/courts?${params}`)
      const data = await response.json()

      if (data.success) {
        setCourts(data.data)
        if (data.pagination) {
          setTotal(data.pagination.total || 0)
          setPages(data.pagination.pages || 1)
        } else {
          setTotal(data.data?.length || 0)
          setPages(1)
        }
      }
    } catch (error) {
      console.error('Error fetching courts:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchWeather = async () => {
    try {
      // Get user location or use default (Ho Chi Minh City)
      const lat = 10.7769
      const lon = 106.7009
      
      const response = await fetch(`/api/weather?lat=${lat}&lon=${lon}`)
      const data = await response.json()

      if (data.success) {
        setWeather(data.data)
      }
    } catch (error) {
      console.error('Error fetching weather:', error)
    }
  }

  const getWeatherIcon = (condition: string) => {
    if (condition.includes('nắng') || condition.includes('sun')) {
      return <Sun className="h-4 w-4 text-yellow-500" />
    } else if (condition.includes('mưa') || condition.includes('rain')) {
      return <CloudRain className="h-4 w-4 text-blue-500" />
    } else {
      return <Cloud className="h-4 w-4 text-gray-500" />
    }
  }

  const getSportTypeInVietnamese = (type: string) => {
    const sportMap: { [key: string]: string } = {
      'football': 'Bóng đá mini',
      'badminton': 'Cầu lông',
      'tennis': 'Tennis',
      'basketball': 'Bóng rổ',
      'volleyball': 'Bóng chuyền',
      'pickleball': 'Pickleball'
    }
    return sportMap[type] || type
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">🏟️</span>
              </div>
              <span className="text-xl font-bold">SportBooking</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                onClick={() => setViewMode('list')}
                size="sm"
              >
                Danh sách
              </Button>
              <Button
                variant={viewMode === 'map' ? 'default' : 'outline'}
                onClick={() => setViewMode('map')}
                size="sm"
              >
                Bản đồ
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Search Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Input
                placeholder="Tìm kiếm sân theo tên hoặc địa chỉ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={selectedSport} onValueChange={setSelectedSport}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn môn thể thao" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả môn</SelectItem>
                <SelectItem value="football">Bóng đá mini</SelectItem>
                <SelectItem value="badminton">Cầu lông</SelectItem>
                <SelectItem value="tennis">Tennis</SelectItem>
                <SelectItem value="basketball">Bóng rổ</SelectItem>
                <SelectItem value="volleyball">Bóng chuyền</SelectItem>
                <SelectItem value="pickleball">Pickleball</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger>
                <SelectValue placeholder="Khung giờ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả giờ</SelectItem>
                <SelectItem value="morning">Sáng (6-12h)</SelectItem>
                <SelectItem value="afternoon">Chiều (12-18h)</SelectItem>
                <SelectItem value="evening">Tối (18-22h)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Weather Info */}
          {weather && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2">
                {getWeatherIcon(weather.current.condition)}
                <span className="text-sm font-medium">
                  Thời tiết hiện tại: {weather.current.temp}°C - {weather.current.condition}
                </span>
                <span className="text-xs text-gray-600">
                  Độ ẩm: {weather.current.humidity}% | Gió: {weather.current.windSpeed}km/h
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {viewMode === 'list' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Tìm thấy {total} sân phù hợp
              </h2>
              {/* <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Bộ lọc
              </Button> */}
            </div>

            {loading ? (
              <div className="grid gap-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="flex">
                      <div className="w-48 h-32 bg-gray-200 rounded-l-lg"></div>
                      <div className="flex-1 p-4 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <>
                <div className="grid gap-4">
                  {courts.map((court) => (
                    <Card key={court._id} className="hover:shadow-lg transition-shadow">
                      <div className="flex flex-col md:flex-row">
                        <div className="w-full md:w-72 h-48 md:h-44">
                          <img
                            src={court.images[0] || "/placeholder.svg?height=200&width=400&query=sports court"}
                            alt={court.name}
                            className="w-full h-full object-cover rounded-t-lg md:rounded-l-lg md:rounded-t-none"
                          />
                        </div>
                        <div className="flex-1 p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-lg font-semibold">{court.name}</h3>
                              <Badge variant="secondary" className="mb-2">
                                {getSportTypeInVietnamese(court.type)}
                              </Badge>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center space-x-1 mb-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="font-medium">{formatRating(court.rating)}</span>
                                {court.reviewCount > 0 && (
                                  <span className="text-sm text-gray-500">({court.reviewCount})</span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center text-gray-600 mb-2">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span className="text-sm">{court.address}</span>
                          </div>
  
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-lg font-bold text-green-600">
                                {court.pricePerHour.toLocaleString('vi-VN')}đ/giờ
                              </div>
                              <div className="text-sm text-gray-600">
                                Chủ sân: {court.owner.name}
                              </div>
                            </div>
                            <Link href={`/court/${court._id}`}>
                              <Button className="bg-green-600 hover:bg-green-700">
                                Đặt sân
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
                {pages > 1 && (
                  <div className="mt-4">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            href="#"
                            onClick={(e) => {
                              e.preventDefault()
                              if (page > 1) setPage(page - 1)
                            }}
                            className={page === 1 ? 'pointer-events-none opacity-50' : ''}
                          />
                        </PaginationItem>

                        {(() => {
                          const items: JSX.Element[] = []
                          const maxToShow = 5
                          let start = Math.max(1, page - 2)
                          let end = Math.min(pages, start + maxToShow - 1)
                          start = Math.max(1, Math.min(start, end - maxToShow + 1))

                          if (start > 1) {
                            items.push(
                              <PaginationItem key={1}>
                                <PaginationLink href="#" onClick={(e) => { e.preventDefault(); setPage(1) }}>1</PaginationLink>
                              </PaginationItem>
                            )
                            if (start > 2) {
                              items.push(
                                <PaginationItem key="start-ellipsis">
                                  <PaginationEllipsis />
                                </PaginationItem>
                              )
                            }
                          }

                          for (let p = start; p <= end; p++) {
                            items.push(
                              <PaginationItem key={p}>
                                <PaginationLink
                                  href="#"
                                  isActive={p === page}
                                  onClick={(e) => { e.preventDefault(); setPage(p) }}
                                >
                                  {p}
                                </PaginationLink>
                              </PaginationItem>
                            )
                          }

                          if (end < pages) {
                            if (end < pages - 1) {
                              items.push(
                                <PaginationItem key="end-ellipsis">
                                  <PaginationEllipsis />
                                </PaginationItem>
                              )
                            }
                            items.push(
                              <PaginationItem key={pages}>
                                <PaginationLink href="#" onClick={(e) => { e.preventDefault(); setPage(pages) }}>{pages}</PaginationLink>
                              </PaginationItem>
                            )
                          }

                          return items
                        })()}

                        <PaginationItem>
                          <PaginationNext
                            href="#"
                            onClick={(e) => {
                              e.preventDefault()
                              if (page < pages) setPage(page + 1)
                            }}
                            className={page === pages ? 'pointer-events-none opacity-50' : ''}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-4">
            <MapComponent courts={courts} />
          </div>
        )}
      </div>
    </div>
  )
}
