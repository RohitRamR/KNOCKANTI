import { useState } from 'react';
import axios from 'axios';
import { Upload, Check, AlertCircle } from 'lucide-react';

const Migration = () => {
    const [csvData, setCsvData] = useState([]);
    const [mapping, setMapping] = useState({
        sku: '',
        name: '',
        price: '',
        stockQuantity: '',
        barcode: ''
    });
    const [headers, setHeaders] = useState([]);
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target.result;
            const lines = text.split('\n');
            if (lines.length > 0) {
                const headerLine = lines[0].trim();
                const headers = headerLine.split(',').map(h => h.trim());
                setHeaders(headers);

                const data = [];
                for (let i = 1; i < lines.length; i++) {
                    if (!lines[i].trim()) continue;
                    const values = lines[i].split(',').map(v => v.trim());
                    const row = {};
                    headers.forEach((h, index) => {
                        row[h] = values[index];
                    });
                    data.push(row);
                }
                setCsvData(data);
                setStep(2);
            }
        };
        reader.readAsText(file);
    };

    const handleImport = async () => {
        // Validation
        if (!mapping.sku || !mapping.name || !mapping.price) {
            alert('Please map at least SKU, Name, and Price columns.');
            return;
        }

        setLoading(true);
        try {
            // Transform data based on mapping
            const products = csvData.map(row => {
                const price = parseFloat(row[mapping.price]);
                const stock = parseInt(row[mapping.stockQuantity]);

                return {
                    sku: row[mapping.sku],
                    name: row[mapping.name],
                    price: isNaN(price) ? 0 : price,
                    stockQuantity: isNaN(stock) ? 0 : stock,
                    barcode: row[mapping.barcode] || ''
                };
            }).filter(p => p.sku && p.name); // Filter out empty rows

            if (products.length === 0) {
                alert('No valid products found to import.');
                setLoading(false);
                return;
            }

            await axios.post('/integrations/external-billing/import-file', { products });
            alert(`Successfully imported ${products.length} products!`);
            setStep(1);
            setCsvData([]);
            setMapping({
                sku: '',
                name: '',
                price: '',
                stockQuantity: '',
                barcode: ''
            });
        } catch (error) {
            alert('Import failed: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const downloadSample = () => {
        const csvContent = "SKU,Name,Price,Stock,Barcode\nITEM-001,Sample Product,100,50,123456789";
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sample_products.csv';
        a.click();
    };

    return (
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Migration Wizard</h2>
                <button onClick={downloadSample} className="text-blue-600 hover:underline text-sm font-medium">
                    Download Sample CSV
                </button>
            </div>

            {step === 1 && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                    <Upload className="mx-auto text-gray-400 mb-4" size={48} />
                    <p className="text-gray-600 mb-4">Upload your existing product CSV file</p>
                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <div className="mt-4 text-xs text-gray-400">
                        Expected format: CSV with headers.
                    </div>
                </div>
            )}

            {step === 2 && (
                <div>
                    <h3 className="text-lg font-semibold mb-4">Map Columns</h3>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        {['sku', 'name', 'price', 'stockQuantity', 'barcode'].map((field) => (
                            <div key={field}>
                                <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{field} {['sku', 'name', 'price'].includes(field) && '*'}</label>
                                <select
                                    className="w-full p-2 border rounded"
                                    value={mapping[field]}
                                    onChange={(e) => setMapping({ ...mapping, [field]: e.target.value })}
                                >
                                    <option value="">Select Column</option>
                                    {headers.map(h => (
                                        <option key={h} value={h}>{h}</option>
                                    ))}
                                </select>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end gap-4">
                        <button
                            onClick={() => setStep(1)}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                        >
                            {loading ? 'Importing...' : 'Confirm Import'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Migration;
