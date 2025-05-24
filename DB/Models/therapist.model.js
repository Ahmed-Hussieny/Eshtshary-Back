import mongoose, { model, Schema } from "mongoose";
import { systemRoles } from '../../src/utils/system-roles.js';

const therapistSchema = new Schema({
    full_name: {
        type: String,
        required: true,
    },
    Job_title: {
        type: String,
    },
    prefix:{
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
    },
    password: {
        type: String,
        default: undefined,
    },
    phoneNumber: {
        type: String,
        required: true,
        unique: true,
    },
    dateOfBirth: {
        type: Date,
        required: true,
    },
    gender: {
        type: String,
        required: true,
        enum: ["ذكر", "أنثى"]
    },
    nationality: {
        type: String,
        required: true,
    },
    countryOfResidence:{
        type: String,
        required: true,
    },
    fluentLanguages: [{
        type: String,
        required: true,
    }],
    highEducation:{
        degree: {
            type: String,
            required: true,
        },
        institution: {
            type: String,
            required: true,
        },
        year: {
            type: Number,
            required: true,
        },
    },
    rate:{
        type: Number,
        default: 0,
    },
    numberOfSessions: {
        type: Number,
        default: 0,
    },
    walletEgp:{
        type: Number,
        default: 0,
    },
    walletUsd:{
        type: Number,
        default: 0,
    },
    category: {
        type: String,
        required: true,
    },
    specialization: [{
        type: String,
        required: true,
    }],
    yearsOfExperience: {
        type: Number,
        required: true,
    },
    experience: [{
        title: {
            type: String,
            
        },
        institution: {
            type: String,
            
        },
        startDate: {
            type: Date,
            
        },
        endDate: {
            type: Date,
            
        },
        description: {
            type: String,
            
        },
        }],
        prices: {
            eg30: {
                type: Number,
                
            },
            eg60: {
                type: Number,
                
            },
            eg90: {
                type: Number,
                
            },
            usd30: {
                type: Number,
                
            },
            usd60: {
                type: Number,
                
            },
            usd90: {
                type: Number,
                
            }
        },
    educations: [{
        degree: {
            type: String,
            
        },
        institution: {
            type: String,
            
        },
        year: {
            type: Number,
            
        },
        startDate: {
            type: Date,
            
        },
        endDate: {
            type: Date,
            
        },
        description: {
            type: String,
            
        },
    }],
    licenseNumber: {
        type: String,
    },
    licenseOrganization: {
        type: Date,
    },
    isWorkingInClinic:{
        type: Boolean,
        default: false,
    },
    clinicName:{
        type: String,
    },
    availabilityForSession:{
        type: String,
        required: true,
        enum: ['عطلة نهاية الأسبوع', 'ايام الأسبوع', "كلاهما"]
    },
    cv: {
        type: String,
        required: true,
    },
    professionalCertificates: [{
        type: String,
        required: true,
    }],
    profilePicture: {
        type: String,
        default: "-",
    },
    // 
    sessionPrice:{
        type: Number,
        // required: true,
    },
    description:{
        type: String,
        // required: true,
    },
    role: {
        type: String,
        default: systemRoles.THERAPIST,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    token:{
        type: String,
        default: undefined,
    },
    resetPasswordToken:{
        type: String,
        default: undefined
    },
    resetPasswordTokenExpires :{
        type: Date,
        default: undefined,
    },
    availability: [{
        day: {
            type: String,
            // required: true,
            enum: ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        },
        slots: [{
            from: {
                type: String,
                required: true,
            },
            to: {
                type: String,
                required: true,
            },
            isAvailable: {
                type: Boolean,
                default: true,
            },
            duration: {
                type: Number,
                required: true,
            },
            datesBooked: [{
                type: Date,
                default: undefined,
            }],
            bookedBy: [{
                type: Schema.Types.ObjectId,
                ref: "User",
                default: undefined,
            }],
        }]
    }]
}, {
    timestamps: true,
});

const Therapist = mongoose.models.Therapist || model("Therapist", therapistSchema);

export default Therapist;
