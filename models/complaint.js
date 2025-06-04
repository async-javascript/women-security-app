const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
     user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    incidentType: String,
    urgencyLevel: String,
    incidentDate: Date,
    incidentTime: String,
    incidentLocation: String,
    incidentDescription: String,
    suspectDescription: String,
    witnessesPresent: Boolean,
    witnessInfo: String,
    reportAnonymously: Boolean,
    reporterName: String,
    reporterPhone: String,
    reporterEmail: String,
    contactPreference: String,
    policeReported: Boolean,
    policeReportNumber: String,
    evidenceFiles: [String], 
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Complaint', complaintSchema);
