import Order from '../../model/orderSchema.js';
import excel from 'exceljs';
import PDFDocument from 'pdfkit-table';
import moment from 'moment/moment.js';


export const loadSalesReport = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 5;
        const skip = (page - 1) * limit;
        let filter = {};
        const filterType = req.query.filterType || 'yearly';
        const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
        const endDate = req.query.endDate ? new Date(req.query.endDate) : null;

        switch (filterType) {
            case 'daily':
                filter.createdAt = {
                    $gte: moment().startOf('day').toDate(),
                    $lt: moment().endOf('day').toDate(),
                };
                break;
            case 'weekly':
                filter.createdAt = {
                    $gte: moment().startOf('isoWeek').toDate(), // Ensure the week starts correctly
                    $lt: moment().endOf('isoWeek').toDate(),
                };
                break;
            case 'yearly':
                filter.createdAt = {
                    $gte: moment().startOf('year').toDate(),
                    $lt: moment().endOf('year').toDate(),
                };
                break;
            case 'custom':
                if (startDate && endDate) {
                    filter.createdAt = {
                        $gte: startDate,
                        $lt: moment(endDate).endOf('day').toDate(),  // Ensure entire end date is included
                    };
                }
                break;
            default:
                break;
        }

        const overallOrderAmount = await Order.aggregate([
            { $match: filter }, { $group: { _id: null, totalAmount: { $sum: '$finalAmount' } } }
        ]);
        const overallDiscount = await Order.aggregate([
            {
                $match: filter
            },
            {
                $group: {
                    _id: null,
                    totalDiscount: {
                        $sum: {
                            $add: ["$discount", "$offerDiscount"]
                        }
                    }
                }
            }
        ]);

        const totalAmount = overallOrderAmount.length > 0 ? overallOrderAmount[0].totalAmount : 0;
        const totalDiscount = overallDiscount.length > 0 ? overallDiscount[0].totalDiscount : 0;
        const salesReport = await Order.find(filter)
            .skip(skip)
            .limit(limit)
            .populate('userId', 'name email')
            .populate('orderedItems.product', 'productName category price').sort({ createdAt: -1 })
            .lean();
        const salesCount = await Order.countDocuments(filter);
        const totalPages = Math.ceil(salesCount / limit);
        res.render('salesreport', {
            salesCount,
            totalAmount,
            totalDiscount,
            salesReport,
            currentPage: page,
            totalPages,
            limit,
            filterType,
            startDate,
            endDate
        });
    } catch (error) {
        console.log("Error loading sales report:", error);
        res.redirect("/admin/apagenotfound")
    }
}




export const downloadSalesReportExcel = async (req, res) => {
    try {
        let filter = {};
        const filterType = req.query.filterType || 'yearly';
        const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
        const endDate = req.query.endDate ? new Date(req.query.endDate) : null;
        switch (filterType) {
            case 'daily':
                filter.createdAt = {
                    $gte: moment().startOf('day').toDate(),
                    $lt: moment().endOf('day').toDate(),
                };
                break;
            case 'weekly':
                filter.createdAt = {
                    $gte: moment().startOf('week').toDate(),
                    $lt: moment().endOf('week').toDate(),
                };
                break;
            case 'yearly':
                filter.createdAt = {
                    $gte: moment().startOf('year').toDate(),
                    $lt: moment().endOf('year').toDate(),
                };
                break;
            case 'custom':
                if (startDate && endDate) {
                    filter.createdAt = {
                        $gte: new Date(startDate),
                        $lt: new Date(endDate),
                    };
                }
                break;
            default:
                break;
        }

        const salesReport = await Order.find(filter)
            .populate('userId', 'name email')
            .populate('orderedItems.product', 'productName category price')
            .lean();
        //  Excel sheet
        const workbook = new excel.Workbook();
        const worksheet = workbook.addWorksheet('Sales Report');
        worksheet.columns = [
            { header: 'Order ID', key: 'orderId', width: 20 },
            { header: 'User Name', key: 'userName', width: 30 },
            { header: 'Products', key: 'Products', width: 50 },
            { header: 'Total Amount', key: 'finalAmount', width: 15 },
            { header: 'Discount', key: 'discount', width: 10 },
            { header: 'Coupon Discount', key: 'couponApplied', width: 15 },
            { header: 'Payment Method', key: 'paymentMethod', width: 15 },
            { header: 'Order Status', key: 'orderStatus', width: 15 }
        ];
        salesReport.forEach(order => {
            const productDetails = order.orderedItems.map(item =>
                `${item.product.productName} (${item.size}, Qty: ${item.quantity})`
            ).join(', ');

            worksheet.addRow({
                orderId: order.orderId,
                userName: order.userId ? order.userId.name : 'Guest',
                Products: productDetails,
                finalAmount: order.finalAmount,
                discount: order.discount,
                couponApplied: order.couponDiscount ? order.couponDiscount: 0.00,
                paymentMethod: order.paymentMethod,
                orderStatus: order.orderStatus
            });
        });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=sales-report.xlsx');
        return workbook.xlsx.write(res).then(() => {
            res.status(200).end();
        });
    } catch (error) {
        console.log("Error generating Excel:", error);    
        res.redirect("/admin/pageError")
    }
};


export const downloadSalesReportPDF = async (req, res) => {
    try {
        let filter = {};
        const filterType = req.query.filterType || 'yearly';
        const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
        const endDate = req.query.endDate ? new Date(req.query.endDate) : null;

        // Apply date filters
        switch (filterType) {
            case 'daily':
                filter.createdAt = {
                    $gte: moment().startOf('day').toDate(),
                    $lt: moment().endOf('day').toDate(),
                };
                break;
            case 'weekly':
                filter.createdAt = {
                    $gte: moment().startOf('week').toDate(),
                    $lt: moment().endOf('week').toDate(),
                };
                break;
            case 'yearly':
                filter.createdAt = {
                    $gte: moment().startOf('year').toDate(),
                    $lt: moment().endOf('year').toDate(),
                };
                break;
            case 'custom':
                if (startDate && endDate) {
                    filter.createdAt = {
                        $gte: new Date(startDate),
                        $lt: new Date(endDate),
                    };
                }
                break;
        }

        const salesReport = await Order.find(filter)
            .populate('userId', 'name email')
            .populate('orderedItems.product', 'productName category price')
            .lean();

        // Create PDF document
        const doc = new PDFDocument({ margin: 30, size: 'A4' });

        // Pipe PDF to response
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=sales-report.pdf');
        doc.pipe(res);

        // Add header
        doc.fontSize(20).text('Sales Report', { align: 'center' });
        doc.moveDown();

        // Add date range info
        const dateText = getDateRangeText(filterType, startDate, endDate);
        doc.fontSize(12).text(dateText, { align: 'center' });
        doc.moveDown();

        // Prepare table data
        const tableData = {
            headers: ['Order ID', 'Customer', 'Products', 'Amount', 'Discount', 'Payment', 'Status'],
            rows: salesReport.map(order => ([
                order.orderId,
                order.userId ? order.userId.name : 'Guest',
                formatProductsList(order.orderedItems),
                `₹${order.finalAmount.toFixed(2)}`,
                `₹${order.discount.toFixed(2)}`,
                order.paymentMethod,
                order.orderStatus
            ]))
        };

        // Add table
        await doc.table({
            title: 'Sales Details',
            subtitle: `Total Orders: ${salesReport.length}`,
            headers: tableData.headers,
            rows: tableData.rows,
            width: 550,
            headerColor: '#eeeeee',
            headerOpacity: 1,
            headerAlign: 'center',
            align: ['left', 'left', 'left', 'right', 'right', 'center', 'center'],
            padding: 5,
            divider: {
                header: { disabled: false, width: 1, opacity: 1 },
                horizontal: { disabled: false, width: 0.5, opacity: 0.5 }
            },
        });

        // Add summary
        doc.moveDown();
        const totalAmount = salesReport.reduce((sum, order) => sum + order.finalAmount, 0);
        const totalDiscount = salesReport.reduce((sum, order) => sum + order.discount, 0);

        doc.fontSize(12).text('Summary:', { underline: true });
        doc.moveDown(0.5);
        doc.text(`Total Sales Amount: ₹${totalAmount.toFixed(2)}`);
        doc.text(`Total Discount Amount: ₹${totalDiscount.toFixed(2)}`);
        doc.text(`Net Amount: ₹${(totalAmount - totalDiscount).toFixed(2)}`);

        // Finalize PDF
        doc.end();

    } catch (error) {
        console.error("Error generating PDF:", error);
        res.status(500).json({ success: false, error: 'Error generating PDF' });
    }
};

// Helper functions
function formatProductsList(orderedItems) {
    return orderedItems.map(item => 
        `${item.product.productName} (${item.size}, Qty: ${item.quantity})`
    ).join('\n');
}

function getDateRangeText(filterType, startDate, endDate) {
    switch (filterType) {
        case 'daily':
            return `Report for ${moment().format('MMMM D, YYYY')}`;
        case 'weekly':
            return `Report for week of ${moment().startOf('week').format('MMMM D')} - ${moment().endOf('week').format('MMMM D, YYYY')}`;
        case 'yearly':
            return `Report for ${moment().format('YYYY')}`;
        case 'custom':
            if (startDate && endDate) {
                return `Report from ${moment(startDate).format('MMMM D, YYYY')} to ${moment(endDate).format('MMMM D, YYYY')}`;
            }
            return 'Custom Report';
        default:
            return 'Sales Report';
    }
}