import { useEffect, useState } from 'react';
import { createInvoice, getInvoices, updateInvoice } from '../../../api/invoiceAPI';
import { Container, Row, Col, Button, ButtonGroup, Badge, Table } from 'react-bootstrap';
import { FaPrint, FaEdit, FaEye, FaPlus } from 'react-icons/fa';
import InvoiceModal from '../../../components/Invoice/InvoiceModal';
import InvoiceDetail from '../../../components/Invoice/InvoiceDetail';
import { getOccupiedRooms } from '../../../api/roomAPI';
import { toast } from 'react-toastify';

const InvoicesPage = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [room, setRoom] = useState([]);

    const [showModal, setShowModal] = useState(false);
    const [editData, setEditData] = useState(null);

    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    const fetchInvoices = async () => {
        try {
            setError(null);
            const response = await getInvoices();

            if (response && response.data && Array.isArray(response.data)) {
                setInvoices(response.data);
            } else {
                setInvoices([]);
            }
        } catch (err) {
            console.error('❌ Error fetching invoices:', err);
            setError(err.message || 'Lỗi khi tải danh sách hóa đơn');
            setInvoices([]);
        }
    };

    const fetchRooms = async () => {
        try {
            const response = await getOccupiedRooms();
            if (response && response.data && response.data.data) {
                setRoom(response.data.data);
            } else {
                setRoom([]);
            }
        } catch (error) {
            console.error('❌ Error fetching rooms:', error);
            setError(error.message || 'Lỗi khi tải danh sách phòng');
            setRoom([]);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                await Promise.all([fetchInvoices(), fetchRooms()]);
            } catch (error) {
                console.error('❌ Error loading data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const formatCurrency = (value) => value.toLocaleString('vi-VN') + ' ₫';

    const renderStatusBadge = (status) => {
        const variant = status === 'paid' ? 'success' : status === 'overdue' ? 'danger' : 'warning';
        return (
            <Badge bg={variant} className="text-capitalize">
                {status}
            </Badge>
        );
    };

    const renderPaymentTypeBadge = (type) => {
        const variant = type === 'Cash' ? 'secondary' : 'info';
        return <Badge bg={variant}>{type}</Badge>;
    };

    const handleCreate = () => {
        setEditData(null);
        setShowModal(true);
    };

    const handleEdit = (invoice) => {
        setEditData(invoice);
        setShowModal(true);
    };

    const handleDetail = (invoice) => {
        setSelectedInvoice(invoice);
        setShowDetailModal(true);
    };

    const handlePrint = (invoice) => alert('In hóa đơn: ' + invoice._id);

    const handleSubmitInvoice = async (values) => {
        try {
            const formData = new FormData();

            formData.append('create_by', values.create_by);
            formData.append('for_room_id', values.for_room_id);
            formData.append('content', values.content);
            formData.append('payment_type', values.payment_type);
            formData.append('invoice_type', values.invoice_type);
            formData.append('payment_status', values.payment_status);
            formData.append('total_amount', values.total_amount);
            formData.append('notify_status', values.notify_status || '');
            formData.append('items', JSON.stringify(values.items));
            formData.append('note', JSON.stringify({ text: values.note?.text || '' }));
            const oldImages = values.note?.img?.filter((img) => typeof img === 'string') || [];
            formData.append('oldImages', JSON.stringify(oldImages));
            const deleteImages =
                editData?.note?.img?.filter(
                    (img) => typeof img === 'string' && !values.note?.img?.includes(img),
                ) || [];
            formData.append('deleteImages', JSON.stringify(deleteImages));
            const newImages = values.note?.img?.filter((img) => img instanceof File) || [];
            newImages.forEach((file) => {
                formData.append('img', file);
            });

            if (values._id) {
                const response = await updateInvoice(values._id, formData);
                if (response.status === 200) return toast.success('Cập nhật hóa đơn thành công!');
            } else {
                const response = await createInvoice(formData);
                if (response.status === 201) return toast.success('Tạo hóa đơn thành công!');
            }
        } catch (err) {
            console.error('❌ Lỗi gửi form:', err);
            toast.error(err.response?.data?.message || 'Gửi dữ liệu thất bại');
        } finally {
            setShowModal(false);
            // Refresh data after a short delay to ensure backend has processed the request
            setTimeout(() => {
                fetchInvoices();
            }, 500);
        }
    };



    if (loading)
        return (
            <Container>
                <p>Đang tải dữ liệu...</p>
            </Container>
        );
    if (error)
        return (
            <Container>
                <p>Lỗi: {error}</p>
            </Container>
        );

    return (
        <Container fluid className="mt-1">
            <Row className="mb-1">
                <Col>
                    <h4>Quản lý hóa đơn</h4>
                </Col>
            </Row>

            <Row className="mb-3">
                <Col>
                    <div className="d-flex justify-content-between align-items-center">
                        <h5>Danh sách hóa đơn ({invoices.length})</h5>
                        <Button variant="primary" onClick={handleCreate}>
                            <FaPlus className="me-2" />
                            Tạo hóa đơn mới
                        </Button>
                    </div>
                </Col>
            </Row>

            <Row>
                <Col>
                    <div className="table-responsive">
                        <Table striped bordered hover>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Ngày tạo</th>
                                    <th>Phòng</th>
                                    <th>Nội dung</th>
                                    <th>Tổng tiền</th>
                                    <th>Thanh toán</th>
                                    <th>Phương thức</th>
                                    <th>Người tạo</th>
                                    <th>Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.map((invoice, index) => (
                                    <tr key={invoice._id}>
                                        <td>{index + 1}</td>
                                        <td>
                                            {invoice.createdAt
                                                ? new Date(invoice.createdAt).toLocaleDateString()
                                                : 'N/A'
                                            }
                                        </td>
                                        <td>{invoice.for_room_id?.roomNumber || 'Chưa xác định'}</td>
                                        <td>{invoice.content || 'Chưa xác định'}</td>
                                        <td>
                                            {invoice.total_amount
                                                ? formatCurrency(invoice.total_amount)
                                                : 'N/A'
                                            }
                                        </td>
                                        <td>{renderStatusBadge(invoice.payment_status)}</td>
                                        <td>{renderPaymentTypeBadge(invoice.payment_type)}</td>
                                        <td>{invoice.create_by?.fullname || 'Chưa xác định'}</td>
                                        <td>
                                            <ButtonGroup size="sm">
                                                <Button
                                                    variant="info"
                                                    onClick={() => handleDetail(invoice)}
                                                    title="Xem chi tiết"
                                                >
                                                    <FaEye />
                                                </Button>
                                                <Button
                                                    variant="warning"
                                                    onClick={() => handleEdit(invoice)}
                                                    title="Chỉnh sửa"
                                                >
                                                    <FaEdit />
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    onClick={() => handlePrint(invoice)}
                                                    title="In hóa đơn"
                                                >
                                                    <FaPrint />
                                                </Button>
                                            </ButtonGroup>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                </Col>
            </Row>

            <InvoiceModal
                show={showModal}
                onHide={() => setShowModal(false)}
                onSubmit={handleSubmitInvoice}
                initialData={
                    editData
                        ? {
                            ...editData,
                            for_room_id: editData?.for_room_id?._id || '',
                            create_by: editData?.create_by?._id || '',
                        }
                        : {
                            content: '',
                            total_amount: 0,
                            invoice_type: '',
                            payment_type: 'e-banking',
                            payment_status: 'pending',
                            for_room_id: '',
                            create_by: '',
                            items: [],
                            note: {
                                img: [],
                                text: '',
                            },
                        }
                }
                mode={editData ? 'edit' : 'create'}
                roomOptions={room}
            />
            {selectedInvoice && (
                <InvoiceDetail
                    show={showDetailModal}
                    onHide={() => setShowDetailModal(false)}
                    invoice={selectedInvoice}
                />
            )}
        </Container>
    );
};

export default InvoicesPage; 