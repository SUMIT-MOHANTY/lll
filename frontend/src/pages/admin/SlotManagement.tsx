import React, { useEffect, useState } from 'react';
import {
  Table, Button, Form, Input, DatePicker, TimePicker, InputNumber,
  Select, Modal, Typography, message, Space, Popconfirm, Card
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import moment from 'moment';
import adminService, { SlotCreateRequest } from '../../services/adminService';

const { Title } = Typography;
const { Option } = Select;

interface Office {
  id: string;
  name: string;
}

interface Slot {
  id: string;
  officeId: string;
  officeName: string;
  date: string;
  time: string;
  capacity: number;
  booked: number;
  available: number;
  description?: string;
}

const SlotManagement: React.FC = () => {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSlot, setEditingSlot] = useState<Slot | null>(null);
  const [form] = Form.useForm();

  // Mock offices data - in a real app, fetch from API
  useEffect(() => {
    setOffices([
      { id: 'office1', name: 'Main Office' },
      { id: 'office2', name: 'Branch Office' },
    ]);
  }, []);

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const response = await adminService.getAllSlots();
      setSlots(response.data);
    } catch (error) {
      console.error('Failed to fetch slots:', error);
      message.error('Failed to load slots');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, []);

  const handleAddSlot = () => {
    setEditingSlot(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditSlot = (slot: Slot) => {
    setEditingSlot(slot);
    form.setFieldsValue({
      officeId: slot.officeId,
      date: moment(slot.date),
      time: moment(slot.time, 'HH:mm'),
      capacity: slot.capacity,
      description: slot.description || ''
    });
    setModalVisible(true);
  };

  const handleDeleteSlot = async (slotId: string) => {
    try {
      await adminService.deleteSlot(slotId);
      message.success('Slot deleted successfully');
      fetchSlots();
    } catch (error) {
      console.error('Failed to delete slot:', error);
      message.error('Failed to delete slot');
    }
  };

  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields();

      const slotData: SlotCreateRequest = {
        officeId: values.officeId,
        date: values.date.format('YYYY-MM-DD'),
        time: values.time.format('HH:mm'),
        capacity: values.capacity,
        description: values.description
      };

      if (editingSlot) {
        await adminService.updateSlot(editingSlot.id, slotData);
        message.success('Slot updated successfully');
      } else {
        await adminService.createSlots([slotData]);
        message.success('Slot created successfully');
      }

      setModalVisible(false);
      fetchSlots();
    } catch (error) {
      console.error('Form submission failed:', error);
    }
  };

  const columns = [
    {
      title: 'Office',
      dataIndex: 'officeName',
      key: 'officeName',
      sorter: (a: Slot, b: Slot) => a.officeName.localeCompare(b.officeName)
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      sorter: (a: Slot, b: Slot) => moment(a.date).unix() - moment(b.date).unix()
    },
    {
      title: 'Time',
      dataIndex: 'time',
      key: 'time',
    },
    {
      title: 'Capacity',
      dataIndex: 'capacity',
      key: 'capacity',
      sorter: (a: Slot, b: Slot) => a.capacity - b.capacity
    },
    {
      title: 'Booked',
      dataIndex: 'booked',
      key: 'booked',
    },
    {
      title: 'Available',
      dataIndex: 'available',
      key: 'available',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Slot) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEditSlot(record)}
          />
          <Popconfirm
            title="Are you sure you want to delete this slot?"
            onConfirm={() => handleDeleteSlot(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="slot-management">
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <Title level={2}>Appointment Slots</Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddSlot}
          >
            Add Slot
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={slots}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />

        <Modal
          title={editingSlot ? "Edit Slot" : "Add New Slot"}
          visible={modalVisible}
          onOk={handleModalSubmit}
          onCancel={() => setModalVisible(false)}
          okText={editingSlot ? "Update" : "Create"}
          width={600}
        >
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              capacity: 10
            }}
          >
            <Form.Item
              name="officeId"
              label="Office"
              rules={[{ required: true, message: 'Please select an office' }]}
            >
              <Select placeholder="Select office">
                {offices.map(office => (
                  <Option key={office.id} value={office.id}>{office.name}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="date"
              label="Date"
              rules={[{ required: true, message: 'Please select a date' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="time"
              label="Time"
              rules={[{ required: true, message: 'Please select a time' }]}
            >
              <TimePicker format="HH:mm" minuteStep={15} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="capacity"
              label="Capacity"
              rules={[
                { required: true, message: 'Please enter capacity' },
                { type: 'number', min: 1, message: 'Capacity must be greater than 0' }
              ]}
            >
              <InputNumber style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="description"
              label="Description (Optional)"
            >
              <Input.TextArea rows={4} />
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </div>
  );
};

export default SlotManagement;
