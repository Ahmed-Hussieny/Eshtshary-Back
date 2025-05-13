import Therapist from "../../../DB/Models/therapist.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import sendEmailService from "../../services/send-email.services.js";
import { verificationEmailTemplate } from "../../utils/verify-email-templet.js";
import fs from "fs";
import path from "path";
import moment from "moment";
import Session from "../../../DB/Models/session.model.js";
//& ====================== SIGN UP ======================
export const signUp = async (req, res, next) => {
  const {
    full_name,
    prefix,
    email,
    phoneNumber,
    dateOfBirth,
    gender,
    nationality,
    countryOfResidence,
    fluentLanguages,
    highestDegree,
    institutionName,
    graduationYear,
    category,
    specialization,
    yearsOfExperience,
    licenseNumber,
    licenseOrganization,
    isWorkingInClinic,
    clinicName,
    availability,
  } = req.body;

  console.log("req.body", specialization);
  // files cv professionalCertificates
  const { cv, professionalCertificates } = req.files;
  if (!cv || !professionalCertificates) {
    return next({
      cause: 400,
      message: "يرجى تحميل السيرة الذاتية والشهادات المهنية",
    });
  }
  // create the path for the cv and professionalCertificates
  const cvPath = `${process.env.SERVER_URL}/uploads${
    cv[0].path.split("/uploads")[1]
  }`;
  const professionalCertificatesPath = professionalCertificates.map((file) => {
    return `${process.env.SERVER_URL}/uploads${file.path.split("/uploads")[1]}`;
  });

  // Check if the Therapist already exists
  const existingTherapist = await Therapist.findOne({ email });
  if (existingTherapist) {
    return next({
      cause: 409,
      message: "هذا البريد الإلكتروني مستخدم بالفعل",
    });
  }
  // check if phone number is already used
  const existingPhoneNumber = await Therapist.findOne({ phoneNumber });
  if (existingPhoneNumber) {
    return next({
      cause: 409,
      message: "هذا الرقم مستخدم بالفعل",
    });
  }

  // Create a new Therapist
  const newTherapist = await Therapist.create({
    full_name,
    prefix,
    email,
    phoneNumber,
    dateOfBirth,
    gender,
    nationality,
    countryOfResidence,
    fluentLanguages,
    highEducation: {
      degree: highestDegree,
      institution: institutionName,
      year: new Date(graduationYear).getFullYear(),
    },
    category,
    specialization,
    yearsOfExperience,
    licenseNumber,
    licenseOrganization,
    isWorkingInClinic,
    clinicName,
    availabilityForSession: availability,
    cv: cvPath,
    professionalCertificates: professionalCertificatesPath,
  });
  if (!newTherapist) {
    return next({
      cause: 500,
      message: "فشل إنشاء المستخدم",
    });
  }
  // Send a verification email
  const isEmailSent = await sendEmailService({
    to: email,
    subject: "Notification Email",
    message: `
            Dear ${full_name},
            Thank you for signing up! We are working on your account and will notify you once it's ready to join us.
            Best regards,
            The Team
        `,
  });
  if (!isEmailSent) return next({ message: "Email is not sent", cause: 500 });
  // Send a response
  return res.status(201).json({
    status: "success",
    success: true,
    message: "تم انشاء المستخدم بنجاح سيتم التواصل معك عبر البريد الإلكتروني",
  });
};

export const acceptTherapist = async (req, res, next) => {
  const { id } = req.params;
  // Check if the Therapist exists
  const existingTherapist = await Therapist.findById(id);
  if (!existingTherapist) {
    return next({
      cause: 404,
      message: "المستخدم غير موجود",
    });
  }
  // Check if the Therapist is already accepted
  if (existingTherapist.isVerified) {
    return next({
      cause: 409,
      message: "المستخدم مقبول بالفعل",
    });
  }
  // Update the Therapist's isVerified field
  existingTherapist.isVerified = true;
  const randomPassword = Math.random().toString(36).slice(-8);
  // Hash the password
  const hashedPassword = await bcrypt.hash(
    randomPassword,
    +process.env.SALT_ROUNDS
  );
  existingTherapist.password = hashedPassword;
  await existingTherapist.save();
  // Send a email
  const isEmailSent = await sendEmailService({
    to: existingTherapist.email,
    subject: "Notification Email",
    message: `
            Dear ${existingTherapist.full_name},
            Your account has been accepted! You can now log in using this password ${randomPassword}.
            Best regards,
            The Team
        `,
  });
  if (!isEmailSent) return next({ message: "Email is not sent", cause: 500 });
  // Send a response
  return res.status(200).json({
    status: "success",
    success: true,
    message: "تم قبول المستخدم بنجاح",
  });
};

//& ====================== ADD APPOINTMENTS ======================
export const addAppointments = async (req, res, next) => {
  const { id } = req.params;
  const { availability } = req.body;

  // Check if the Therapist exists
  const existingTherapist = await Therapist.findById(id);
  if (!existingTherapist) {
    return next({
      cause: 404,
      message: "المستخدم غير موجود",
    });
  }

  // Validate the incoming availability data
  if (!availability || !Array.isArray(availability)) {
    return next({
      cause: 400,
      message: "يجب تقديم بيانات التوفر بشكل صحيح",
    });
  }

  // Function to calculate duration in minutes from time strings (HH:MM format)
  const calculateDuration = (from, to) => {
    const [fromHours, fromMinutes] = from.split(":").map(Number);
    const [toHours, toMinutes] = to.split(":").map(Number);

    const fromTotal = fromHours * 60 + fromMinutes;
    const toTotal = toHours * 60 + toMinutes;

    return toTotal - fromTotal;
  };

  // Function to check if two time slots overlap
  const hasTimeConflict = (slot1, slot2) => {
    const timeToMinutes = (time) => {
      const [hours, minutes] = time.split(":").map(Number);
      return hours * 60 + minutes;
    };

    const start1 = timeToMinutes(slot1.from);
    const end1 = timeToMinutes(slot1.to);
    const start2 = timeToMinutes(slot2.from);
    const end2 = timeToMinutes(slot2.to);

    return start1 < end2 && end1 > start2;
  };

  try {
    const newAvailability = availability.map((day) => ({
      day: day.day,
      slots: day.slots.map((slot) => ({
        from: slot.from,
        to: slot.to,
        duration: calculateDuration(slot.from, slot.to),
        isAvailable: true,
        datesBooked: [],
        bookedBy: [],
      })),
    }));
    existingTherapist.availability = newAvailability;

    // Save the updated therapist
    await existingTherapist.save();

    // Send a response
    return res.status(200).json({
      status: "success",
      success: true,
      message: "تم إضافة المواعيد بنجاح",
      data: existingTherapist.availability,
    });
  } catch (error) {
    return next({
      cause: 500,
      message: error.message || "حدث خطأ أثناء إضافة المواعيد",
    });
  }
};

//& ====================== Update Therapist Image ======================
export const updateTherapistImage = async (req, res, next) => {
  const { id } = req.params;
  // Check if the Therapist exists
  console.log("req.params", req.params);
  const existingTherapist = await Therapist.findById(id);
  if (!existingTherapist) {
    return next({
      cause: 404,
      message: "المستخدم غير موجود",
    });
  }
  // Check if the profile picture is provided
  if (
    !req.files ||
    !req.files.profilePicture ||
    req.files.profilePicture.length === 0
  ) {
    return next({
      cause: 400,
      message: "يرجى تحميل صورة الملف الشخصي",
    });
  }
  // Delete the old profile picture if it exists
  if (existingTherapist.profilePicture) {
    const imagePath = path.join(
      process.cwd(),
      existingTherapist.profilePicture.replace(`${process.env.SERVER_URL}`, "") // Convert URL to local path
    );
    // Check if the file exists before deleting
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
  }
  // Create the new profile picture URL
  const imageUrl = `${process.env.SERVER_URL}/uploads${
    req.files.profilePicture[0].path.split("/uploads")[1]
  }`;
  // Update the Therapist's profile picture
  existingTherapist.profilePicture = imageUrl;
  await existingTherapist.save();
  // Send a response
  return res.status(200).json({
    status: "success",
    success: true,
    message: "تم تحديث صورة الملف الشخصي بنجاح",
    data: {
      profilePicture: existingTherapist.profilePicture,
    },
  });
};

//& ====================== GET ALL TherapistS ======================
export const getAllTherapists = async (req, res, next) => {
    const Therapists = await Therapist.find({
        isVerified: true
    }).select("-password -__v");
    if (!Therapists) {
      return next({
        cause: 404,
        message: "لا يوجد مستخدمين",
      });
    }
    return res.status(200).json({
      status: "success",
      success: true,
      message: "تم استرجاع جميع المستخدمين بنجاح",
      data: {
        Therapists,
      },
    });
  };

//& ====================== GET USER BY ID ======================
export const getTherapistById = async (req, res, next) => {
    const { id } = req.params;
    const therapist = await Therapist.findById(id).select("-password -__v");
  
    if (!therapist) {
      return next({
        cause: 404,
        message: "المستخدم غير موجود",
      });
    }
  
    return res.status(200).json({
      status: "success",
      success: true,
      message: "تم استرجاع المستخدم بنجاح",
      data: {
        therapist,
      },
    });
  };
  
  //& ====================== GET Logged In Therapist  ======================
  export const getLoggedInTherapist = async (req, res, next) => {
    const { id } = req.authTherapist;
    const therapist = await Therapist.findById(id).select("-password -__v");
  
    if (!therapist) {
      return next({
        cause: 404,
        message: "المستخدم غير موجود",
      });
    }
  
    return res.status(200).json({
      status: "success",
      success: true,
      message: "تم استرجاع المستخدم بنجاح",
      data: {
        therapist,
      },
    });
  };
  
  //& ====================== UPDATE USER ======================
  export const updateTherapist = async (req, res, next) => {
    const { id } = req.authTherapist;
    const {
      Job_title,
      full_name,
      prefix,
      email,
      phoneNumber,
      oldPassword,
      newPassword,
      dateOfBirth,
      description,
      availabilityForSession,
      gender,
      countryOfResidence,
      fluentLanguages,
      highEducation,
      category,
      specialization,
      yearsOfExperience,
      educations,
      experience,
      isWorkingInClinic,
      licenseOrganization,
      clinicName,
      licenseNumber,
      nationality,
      prices,
    } = req.body;
    const existingTherapist = await Therapist.findById(id);
    if (!existingTherapist) {
      return next({
        cause: 404,
        message: "المستخدم غير موجود",
      });
    }
  
    // Update the Therapist's fields
    if (email) {
      // Check if the email is already used by another user
      const emailExists = await Therapist.findOne({ email });
      if (emailExists && emailExists._id.toString() !== id) {
        return next({
          cause: 409,
          message: "هذا البريد الإلكتروني مستخدم بالفعل",
        });
      }
      existingTherapist.email = email;
    }
    // Check if the old password is correct
    if (oldPassword && newPassword) {
      const isPasswordValid = await bcrypt.compare(
        oldPassword,
        existingTherapist.password
      );
      if (!isPasswordValid) {
        return next({
          cause: 401,
          message: "كلمة المرور القديمة غير صحيحة",
        });
      }
      // Hash the new password
      const hashedPassword = await bcrypt.hash(
        newPassword,
        +process.env.SALT_ROUNDS
      );
      existingTherapist.password = hashedPassword;
    }
    existingTherapist.Job_title = Job_title || existingTherapist.Job_title;
    existingTherapist.full_name = full_name || existingTherapist.full_name;
    existingTherapist.prefix = prefix || existingTherapist.prefix;
    existingTherapist.availabilityForSession =
      availabilityForSession || existingTherapist.availabilityForSession;
    existingTherapist.description = description || existingTherapist.description;
    existingTherapist.phoneNumber = phoneNumber || existingTherapist.phoneNumber;
    existingTherapist.dateOfBirth = dateOfBirth || existingTherapist.dateOfBirth;
    existingTherapist.category = category || existingTherapist.category;
    existingTherapist.clinicName = clinicName || existingTherapist.clinicName;
    existingTherapist.countryOfResidence =
      countryOfResidence || existingTherapist.countryOfResidence;
    existingTherapist.fluentLanguages =
      fluentLanguages || existingTherapist.fluentLanguages;
    existingTherapist.highEducation =
      highEducation || existingTherapist.highEducation;
    existingTherapist.educations = educations || existingTherapist.educations;
    existingTherapist.experience = experience || existingTherapist.experience;
    existingTherapist.isWorkingInClinic =
      isWorkingInClinic || existingTherapist.isWorkingInClinic;
    existingTherapist.licenseNumber =
      licenseNumber || existingTherapist.licenseNumber;
    existingTherapist.licenseOrganization =
      licenseOrganization || existingTherapist.licenseOrganization;
    existingTherapist.nationality = nationality || existingTherapist.nationality;
    existingTherapist.specialization =
      specialization || existingTherapist.specialization;
    existingTherapist.yearsOfExperience =
      yearsOfExperience || existingTherapist.yearsOfExperience;
    existingTherapist.prices = prices || existingTherapist.prices;
    existingTherapist.gender = gender || existingTherapist.gender;
  
    // Save the updated Therapist
    await existingTherapist.save();
    // Send a response
    return res.status(200).json({
      status: "success",
      success: true,
      message: "تم تحديث المستخدم بنجاح",
      data: {
        therapist: {
          id: existingTherapist._id,
          username: existingTherapist.username,
          email: existingTherapist.email,
        },
      },
    });
  };



//& ====================== VERIFY EMAIL ======================
export const verifyEmail = async (req, res, next) => {
  const { token } = req.params;
  // Verify the token
  const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  if (!decodedToken) {
    return next({
      cause: 401,
      message: "رمز التحقق غير صالح",
    });
  }
  // Check if the Therapist exists
  const existingTherapist = await Therapist.findOne({
    email: decodedToken.email,
  });
  if (!existingTherapist) {
    return next({
      cause: 404,
      message: "المستخدم غير موجود",
    });
  }
  // Update the user's isVerified field
  existingTherapist.isVerified = true;
  await existingTherapist.save();
  // Send a response
  return res.status(200).json({
    status: "success",
    success: true,
    message: "تم التحقق من البريد الإلكتروني بنجاح",
  });
};

//& ====================== SIGN IN ======================
export const signIn = async (req, res, next) => {
  const { email, password } = req.body;
  // Check if the Therapist exists
  const existingTherapist = await Therapist.findOne({ email });
  if (!existingTherapist) {
    return next({
      cause: 401,
      message: "البريد الإلكتروني غير صحيح",
    });
  }
  // Check if the password is correct
  const isPasswordValid = await bcrypt.compare(
    password,
    existingTherapist.password
  );
  if (!isPasswordValid) {
    return next({
      cause: 401,
      message: "كلمة المرور غير صحيحة",
    });
  }
  // Generate a token
  const token = jwt.sign(
    { id: existingTherapist._id, role: existingTherapist.role },
    process.env.JWT_SECRET
    // { expiresIn: "1h" }
  );
  existingTherapist.token = token;
  await existingTherapist.save();
  // Send a response
  return res.status(200).json({
    status: "success",
    success: true,
    message: "تم تسجيل الدخول بنجاح",
    data: {
      therapist: {
        id: existingTherapist._id,
        username: existingTherapist.username,
        email: existingTherapist.email,
        role: existingTherapist.role,
      },
      token,
    },
  });
};

//& ====================== FORGOT PASSWORD ======================
export const forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  // Check if the Therapist exists
  const existingTherapist = await Therapist.findOne({ email });
  if (!existingTherapist) {
    return next({
      cause: 404,
      message: "المستخدم غير موجود",
    });
  }
  // Generate a reset password token
  const resetPasswordToken = jwt.sign(
    { id: existingTherapist._id },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
  // Update the Therapist's resetPasswordToken and resetPasswordTokenExpires fields
  existingTherapist.resetPasswordToken = resetPasswordToken;
  existingTherapist.resetPasswordTokenExpires = Date.now() + 3600000; // 1 hour
  await existingTherapist.save();
  // Send a reset password email
  const isEmailSent = await sendEmailService({
    to: email,
    subject: "Reset Password",
    message: verificationEmailTemplate(
      existingTherapist.username,
      `${process.env.CLIENT_URL}/resetPassword/${resetPasswordToken}`
    ),
  });
  if (!isEmailSent) return next({ message: "Email is not sent", cause: 500 });
  // Send a response
  return res.status(200).json({
    status: "success",
    success: true,
    message: "تم إرسال بريد إعادة تعيين كلمة المرور بنجاح",
  });
};

//& ====================== RESET PASSWORD ======================
export const resetPassword = async (req, res, next) => {
  const { token } = req.params;
  const { password } = req.body;
  // Verify the token
  const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  if (!decodedToken) {
    return next({
      cause: 401,
      message: "رمز إعادة تعيين كلمة المرور غير صالح",
    });
  }
  // Check if the Therapist exists
  const existingTherapist = await Therapist.findById(decodedToken.id);
  if (!existingTherapist) {
    return next({
      cause: 404,
      message: "المستخدم غير موجود",
    });
  }
  // Check if the reset password token is valid
  if (
    existingTherapist.resetPasswordToken !== token ||
    existingTherapist.resetPasswordTokenExpires < Date.now()
  ) {
    return next({
      cause: 401,
      message: "رمز إعادة تعيين كلمة المرور غير صالح أو منتهي الصلاحية",
    });
  }
  // Hash the new password
  const hashedPassword = await bcrypt.hash(password, +process.env.SALT_ROUNDS);
  // Update the Therapist's password and clear the reset password token fields
  existingTherapist.password = hashedPassword;
  existingTherapist.resetPasswordToken = undefined;
  existingTherapist.resetPasswordTokenExpires = undefined;
  await existingTherapist.save();
  // Send a response
  return res.status(200).json({
    status: "success",
    success: true,
    message: "تم إعادة تعيين كلمة المرور بنجاح",
  });
};





//& ====================== DELETE Therapist ======================
export const deleteTherapist = async (req, res, next) => {
  const { id } = req.params;
  // Check if the Therapist exists
  const existingTherapist = await Therapist.findById(id);
  if (!existingTherapist) {
    return next({
      cause: 404,
      message: "المستخدم غير موجود",
    });
  }

  if (existingTherapist.profilePicture) {
    const imagePath = path.join(
      process.cwd(),
      existingTherapist.profilePicture.replace(`${process.env.SERVER_URL}`, "") // Convert URL to local path
    );

    // Check if the file exists before deleting
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
  }
  // Delete the Therapist
  await Therapist.findByIdAndDelete(id);
  if (!existingTherapist) {
    return next({
      cause: 500,
      message: "فشل حذف المستخدم",
    });
  }
  // Send a response
  return res.status(200).json({
    status: "success",
    success: true,
    message: "تم حذف المستخدم بنجاح",
    data: {
      therapist: {
        id: existingTherapist._id,
      },
    },
  });
};

//& ====================== Get Available Slots besed on Date of Session ======================

export const getAvailableSlots = async (req, res, next) => {
  try {
    const { id, date } = req.params;

    // 1. Validate Therapist
    const therapist = await Therapist.findById(id);
    if (!therapist) {
      return next({
        status: 404,
        message: "المعالج غير موجود",
      });
    }

    console.log("therapist", date.split("T")[0]);
    // 2. Validate Therapist's Availability
    const selectedDate = moment(date.split("T")[0]);
    const dayName = selectedDate.format("dddd"); // Get the name of the day (e.g., "Monday")
    const availability = therapist.availability.find(
      (day) => day.day === dayName
    );
    if (!availability) {
      return next({
        status: 404,
        message: "لا يوجد جدول متاح لهذا اليوم",
      });
    }

    const slotsIds = availability.slots.map((slot) => slot._id.toString());

    // 4. Check Booked Sessions
    const startOfDay = selectedDate.toDate();
    const endOfDay = selectedDate.clone().endOf("day").toDate();

    const slotsIdInSessionInDate = await Session.find({
      therapistId: id,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: "cancelled" }, // Exclude cancelled sessions
    }).select("slotId");
    const slotsIdInSessionInDateIds = slotsIdInSessionInDate.map((slot) =>
      slot.slotId.toString()
    );
    const slotsThatNotBooked = slotsIds.filter(
      (slotId) => !slotsIdInSessionInDateIds.includes(slotId)
    );

    // const bookedSessions = await Session.find({
    //     therapistId: id,
    //     data,
    //     slotId: { $ne: slotsIds },
    //     status: { $ne: 'cancelled' } // Exclude cancelled sessions
    // }).select('from to');

    // 5. Filter Available Slots
    const availableSlots = availability.slots
      .filter((slot) => {
        const isBooked = slotsThatNotBooked.includes(slot._id.toString());
        return isBooked && slot.isAvailable;
      })
      .map((slot) => ({
        _id: slot._id,
        from: slot.from,
        to: slot.to,
        isAvailable: slot.isAvailable,
      }));

    if (availableSlots.length === 0) {
      return next({
        status: 404,
        message: "لا توجد مواعيد متاحة لهذا اليوم",
      });
    }

    // 6. Send Response
    return res.status(200).json({
      status: "success",
      message: "تم استرجاع المواعيد المتاحة بنجاح",
      data: {
        availableSlots,
      },
    });
  } catch (error) {
    console.error("Error in getAvailableSlots:", error);
    return next({
      status: 500,
      message: "حدث خطأ أثناء جلب المواعيد المتاحة",
    });
  }
};
