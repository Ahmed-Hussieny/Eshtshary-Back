import Therapist from "../../../DB/Models/therapist.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import sendEmailService from "../../services/send-email.services.js";
import { verificationEmailTemplate } from "../../utils/verify-email-templet.js";
import fs from "fs";
import path from "path";
import moment from "moment";
import Session from "../../../DB/Models/session.model.js";
import { APIFeatures } from "../../utils/api-feature.js";
import { forgotPasswordTemplate } from "../../utils/templates/forgotPassword.js";
import { resetPasswordTemplate } from "../../utils/templates/resetPassword.js";
import { acceptTherapistTemplate, rejectTherapistTemplate } from "../../utils/templates/therapist.js";
import { signUpTherapistThemplate } from "../../utils/templates/signUpTherapist.js";
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
    availability,
  } = req.body;
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
    subject: "حسابك قيد المراجعة",
    message: signUpTherapistThemplate(full_name)
  });
  if (!isEmailSent) return next({ message: "Email is not sent", cause: 500 });
  // Send a response
  return res.status(201).json({
    status: "success",
    success: true,
    message: "تم انشاء المستخدم بنجاح سيتم التواصل معك عبر البريد الإلكتروني",
  });
};

//& =================== ACCEPT THERAPIST ======================
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
    subject: "أهلاً في Arab ADHD حسابك اتفعل، يلا نجهزه سوا!",
    message: acceptTherapistTemplate(existingTherapist.full_name, existingTherapist.email, randomPassword, `${process.env.THERAPIST_URL}`),
  });
  if (!isEmailSent) return next({ message: "Email is not sent", cause: 500 });
  // Send a response
  return res.status(200).json({
    status: "success",
    success: true,
    message: "تم قبول المستخدم بنجاح",
  });
};

//& ====================== Reject THERAPIST ======================
export const rejectTherapist = async (req, res, next) => {
  const { id } = req.params;
  // Check if the Therapist exists
  const existingTherapist = await Therapist.findById(id);
  if (!existingTherapist) {
    return next({
      cause: 404,
      message: "المستخدم غير موجود",
    });
  }
  // Send a rejection email
  const isEmailSent = await sendEmailService({
    to: existingTherapist.email,
    subject: "عذرًا، طلبك للانضمام كمعالج على Arab ADHD لم يُقبل",
    message:rejectTherapistTemplate(existingTherapist.full_name),
  });
  if (!isEmailSent) return next({ message: "Email is not sent", cause: 500 });
  //delete the Therapist
  await Therapist.findByIdAndDelete(id);
  // Send a response
  return res.status(200).json({
    status: "success",
    success: true,
    message: "تم رفض المستخدم بنجاح",
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

//& ====================== getAllTherapists For Admin ======================
export const getAllTherapistsForAdmin = async (req, res, next) => {
  const { page, size, ...search } = req.query;
  if (!page) page = 1;
  const feature = new APIFeatures(
    req.query,
    Therapist.find().select("-password -__v")
  );
  feature.pagination({ page, size });
  feature.search(search);
  const Therapists = await feature.mongooseQuery;

  const queryFilter = {};
  if (search.full_name)
    queryFilter.full_name = { $regex: search.full_name, $options: "i" };
  const numberOfPages = Math.ceil(
    (await Therapist.countDocuments(queryFilter)) / (size || 10)
  );
  return res.status(200).json({
    status: "success",
    success: true,
    message: "تم استرجاع جميع المستخدمين بنجاح",
    data: {
      Therapists,
      numberOfPages,
    },
  });
};
//& ====================== GET ALL TherapistS ======================
export const getAllTherapists = async (req, res, next) => {
  try {
    const { page = 1, size = 10, specialization, ...search } = req.query;
    // Build base query conditions
    const queryConditions = {
      isVerified: true,
      prices: { $ne: null },
    };

    if (specialization) {
      queryConditions.specialization = { $in: [specialization] };
    }

    // Initialize APIFeatures
    const baseQuery = Therapist.find(queryConditions).select("-password -__v");
    const feature = new APIFeatures(req.query, baseQuery);

    // Apply pagination and search if implemented in APIFeatures
    feature.pagination({ page, size });
    feature.search(search);

    // Execute query
    const Therapists = await feature.mongooseQuery;

    return res.status(200).json({
      status: "success",
      success: true,
      message: "تم استرجاع جميع المستخدمين بنجاح",
      data: {
        Therapists,
      },
    });
  } catch (error) {
    return next(error);
  }
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
    licenseOrganization,
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
  existingTherapist.countryOfResidence =
    countryOfResidence || existingTherapist.countryOfResidence;
  existingTherapist.fluentLanguages =
    fluentLanguages || existingTherapist.fluentLanguages;
  existingTherapist.highEducation =
    highEducation || existingTherapist.highEducation;
  existingTherapist.educations = educations || existingTherapist.educations;
  existingTherapist.experience = experience || existingTherapist.experience;
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

//& ====================== verifyResetToken ======================
export const verifyResetToken = async (req, res, next) => {
  // 1- get the reset code from the request body
  const { token } = req.query;

  // 2- Find the user by email
  const user = await Therapist.findOne({
    resetPasswordToken: token,
    resetPasswordTokenExpires: { $gt: Date.now() }, // Check expiry
  });
  if (!user)
    return next({
      message: " لقد انتهت مدة التغيير يمكنك ارسال رمز التغيير مرة اخرى",
      cause: 404,
    });
  return res.status(200).json({ success: true, message: "Token is valid" });
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
    subject: "هل نسيت كلمة المرور؟ ولا يهمك",
    message: forgotPasswordTemplate(
      existingUser.full_name,
      `${process.env.THERAPIST_URL}/resetPassword/${resetPasswordToken}`
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
  console.log("token", token);
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

  const isEmailSent = await sendEmailService({
    to: existingTherapist.email,
    subject: "تم تحديث كلمة المرور الخاصة بك",
    message: resetPasswordTemplate(existingUser.full_name),
  });
  if (!isEmailSent) return next({ message: "Email is not sent", cause: 500 });
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
