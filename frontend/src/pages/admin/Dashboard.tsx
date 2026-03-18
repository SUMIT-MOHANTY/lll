import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Typography, Button, Statistic } from 'antd';
import adminService, { BookingAnalytics, OfficeAnalytics } from '../../services/adminService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CalendarOutlined, TeamOutlined, SettingOutlined } from '@ant-design/icons';

const { Title } = Typography;

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [bookingAnalytics, setBookingAnalytics] = useState<BookingAnalytics | null>(null);
  const [officeAnalytics, setOfficeAnalytics] = useState<{ offices: OfficeAnalytics[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const [bookingData, officeData] = await Promise.all([
          adminService.getBookingAnalytics(),
          adminService.getOfficeAnalytics()
        ]);
        setBookingAnalytics(bookingData);
        setOfficeAnalytics(officeData);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
        setError('Failed to load analytics data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  return (
    <div className="admin-dashboard">
      <Row gutter={[16, 16]} align="middle" justify="space-between">
        <Col>
          <Title level={2}>Admin Dashboard</Title>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<SettingOutlined />}
            onClick={() => navigate('/admin/slots')}
          >
            Manage Slots
          </Button>
        </Col>
      </Row>

      {error && (
        <Row>
          <Col span={24}>
            <div className="error-message">{error}</div>
          </Col>
        </Row>
      )}

      <Row gutter={16} className="stats-row">
        <Col xs={24} sm={8}>
          <Card loading={loading}>
            <Statistic
              title="Total Bookings"
              value={bookingAnalytics?.totalBookings || 0}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card loading={loading}>
            <Statistic
              title="Available Offices"
              value={officeAnalytics?.offices.length || 0}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card loading={loading}>
            <Statistic
              title="Average Availability"
              value={officeAnalytics?.offices.reduce((acc, office) => acc + office.availability, 0) /
                    (officeAnalytics?.offices.length || 1)}
              precision={2}
              suffix="%"
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={24} lg={12}>
          <Card title="Bookings by Office" loading={loading}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={bookingAnalytics?.bookingsByOffice || []}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="officeName" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="bookingCount" fill="#1890ff" name="Bookings" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col span={24} lg={12}>
          <Card title="Bookings by Date" loading={loading}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={bookingAnalytics?.bookingsByDate || []}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="bookingCount" fill="#52c41a" name="Bookings" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
