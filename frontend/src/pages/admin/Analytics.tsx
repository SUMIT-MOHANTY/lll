import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, DatePicker, Spin, Alert } from 'antd';
import moment from 'moment';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import adminService, { BookingAnalytics } from '../../services/adminService';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const Analytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingAnalytics, setBookingAnalytics] = useState<BookingAnalytics | null>(null);
  const [dateRange, setDateRange] = useState<[moment.Moment, moment.Moment] | null>(null);

  const fetchAnalytics = async (startDate?: string, endDate?: string) => {
    try {
      setLoading(true);
      const data = await adminService.getBookingAnalytics(startDate, endDate);
      setBookingAnalytics(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleDateRangeChange = (dates: any) => {
    if (!dates || dates.length !== 2) {
      setDateRange(null);
      fetchAnalytics();
      return;
    }

    const [start, end] = dates;
    setDateRange([start, end]);
    fetchAnalytics(
      start.format('YYYY-MM-DD'),
      end.format('YYYY-MM-DD')
    );
  };

  const renderPieChart = () => {
    if (!bookingAnalytics || !bookingAnalytics.bookingsByOffice.length) {
      return <div className="empty-chart">No data available</div>;
    }

    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={bookingAnalytics.bookingsByOffice}
            cx="50%"
            cy="50%"
            labelLine={true}
            label={({ officeName, bookingCount }) => `${officeName}: ${bookingCount}`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="bookingCount"
            nameKey="officeName"
          >
            {bookingAnalytics.bookingsByOffice.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  const renderDateLineChart = () => {
    if (!bookingAnalytics || !bookingAnalytics.bookingsByDate.length) {
      return <div className="empty-chart">No data available</div>;
    }

    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={bookingAnalytics.bookingsByDate}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="bookingCount"
            stroke="#8884d8"
            activeDot={{ r: 8 }}
            name="Bookings"
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="analytics-page">
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Title level={2}>Booking Analytics</Title>
        </Col>
        <Col xs={24} lg={8}>
          <RangePicker
            style={{ width: '100%' }}
            onChange={handleDateRangeChange}
            value={dateRange}
          />
        </Col>
      </Row>

      {error && (
        <Row>
          <Col span={24}>
            <Alert message={error} type="error" showIcon />
          </Col>
        </Row>
      )}

      <Spin spinning={loading} tip="Loading analytics...">
        <Row gutter={16}>
          <Col span={24}>
            <Card title="Total Bookings Over Time">
              {renderDateLineChart()}
            </Card>
          </Col>
        </Row>

        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col xs={24} lg={12}>
            <Card title="Bookings by Office">
              {renderPieChart()}
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="Office Comparison">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={bookingAnalytics?.bookingsByOffice || []}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="officeName" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="bookingCount" fill="#82ca9d" name="Bookings" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
};

export default Analytics;
