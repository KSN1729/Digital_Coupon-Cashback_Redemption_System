import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(
        f'<w:tcMar {nsdecls("w")}>'
        f'<w:top w:w="{top}" w:type="dxa"/>'
        f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'<w:left w:w="{left}" w:type="dxa"/>'
        f'<w:right w:w="{right}" w:type="dxa"/>'
        f'</w:tcMar>'
    )
    tcPr.append(tcMar)

def create_instructions_doc(filename="BlockCoupon_Project_Report_Instructions.docx"):
    doc = docx.Document()

    # Set Margins (1 inch all around)
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # Styles & Colors
    PRIMARY_COLOR = RGBColor(14, 56, 122)      # Deep Academic Navy
    SECONDARY_COLOR = RGBColor(70, 80, 95)    # Slate Gray
    TEXT_COLOR = RGBColor(33, 37, 41)         # Off-black Charcoal
    BORDER_HEX = "CCCCCC"
    HEADER_FILL = "0E387A"
    ALT_ROW_FILL = "F4F6F9"

    # Set normal style
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Calibri'
    normal_style.font.size = Pt(11)
    normal_style.font.color.rgb = TEXT_COLOR
    normal_style.paragraph_format.line_spacing = 1.15
    normal_style.paragraph_format.space_after = Pt(4)

    # Helper function for Headings
    def add_custom_heading(text, level):
        h = doc.add_heading(text, level=level)
        h.paragraph_format.keep_with_next = True
        run = h.runs[0]
        run.font.name = 'Calibri'
        if level == 1:
            run.font.size = Pt(18)
            run.font.bold = True
            run.font.color.rgb = PRIMARY_COLOR
            h.paragraph_format.space_before = Pt(14)
            h.paragraph_format.space_after = Pt(6)
        elif level == 2:
            run.font.size = Pt(14)
            run.font.bold = True
            run.font.color.rgb = PRIMARY_COLOR
            h.paragraph_format.space_before = Pt(10)
            h.paragraph_format.space_after = Pt(4)
        elif level == 3:
            run.font.size = Pt(12)
            run.font.bold = True
            run.font.color.rgb = SECONDARY_COLOR
            h.paragraph_format.space_before = Pt(8)
            h.paragraph_format.space_after = Pt(2)
        return h

    # --- TITLE / COVER BLOCK ---
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(0)
    title_p.paragraph_format.space_after = Pt(2)
    title_run = title_p.add_run("MASTER INSTRUCTION SPECIFICATION")
    title_run.font.name = 'Calibri'
    title_run.font.size = Pt(24)
    title_run.font.bold = True
    title_run.font.color.rgb = PRIMARY_COLOR

    subtitle_p = doc.add_paragraph()
    subtitle_p.paragraph_format.space_after = Pt(16)
    sub_run = subtitle_p.add_run("B.Tech Final Year Comprehensive Project Report Writing Directive\nDepartment of Computer Science and Engineering")
    sub_run.font.name = 'Calibri'
    sub_run.font.size = Pt(13)
    sub_run.font.color.rgb = SECONDARY_COLOR

    # --- SECTION: PROJECT DETAILS TABLE ---
    add_custom_heading("1. PROJECT DETAILS", level=1)
    
    table = doc.add_table(rows=4, cols=2)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False

    details = [
        ("Student Name", "Kakarla Sankar Narayana"),
        ("Department", "Computer Science and Engineering"),
        ("Project Title", "BlockCoupon: Blockchain-Based Digital Coupon & Cashback Redemption System"),
        ("Project Type", "B.Tech Final Year Academic Project Report")
    ]

    col_widths = [Inches(2.2), Inches(4.3)]

    for row_idx, (k, v) in enumerate(details):
        row = table.rows[row_idx]
        cell_k, cell_v = row.cells[0], row.cells[1]
        
        cell_k.width = col_widths[0]
        cell_v.width = col_widths[1]

        cell_k.paragraphs[0].paragraph_format.space_after = Pt(2)
        cell_v.paragraphs[0].paragraph_format.space_after = Pt(2)

        rk = cell_k.paragraphs[0].add_run(k)
        rk.font.bold = True
        rk.font.color.rgb = PRIMARY_COLOR
        
        rv = cell_v.paragraphs[0].add_run(v)
        rv.font.bold = (row_idx == 2) # bold project title

        set_cell_background(cell_k, "EBF0F8")
        set_cell_background(cell_v, "FFFFFF" if row_idx % 2 == 0 else "F9FAFC")
        set_cell_margins(cell_k, top=100, bottom=100, left=150, right=150)
        set_cell_margins(cell_v, top=100, bottom=100, left=150, right=150)

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # --- SECTION: PROFESSIONAL ROLE ---
    add_custom_heading("2. PROFESSIONAL ROLE DEFINITIONS", level=1)
    p_role = doc.add_paragraph(
        "For the synthesis and authoring of this document, the system operates in the strict capacity of an industry-leading multidisciplinary specialist embodying the following roles:"
    )
    roles = [
        ("B.Tech Project Report Writer", "Mastery of formal academic university thesis structures, technical formatting, academic grammar, formal prose, and rigor."),
        ("Blockchain Architect", "Deep expertise in hybrid on-chain/off-chain settlement systems, cryptographic commitments, EVM execution, state consensus, and decentralized security."),
        ("Solidity Developer", "Expert in writing, compiling, testing, auditing, and explaining smart contract functions, gas optimizations, OpenZeppelin standards, and reentrancy protections."),
        ("Full Stack Application Analyst", "Comprehensive evaluator of React.js, Tailwind CSS, Node.js, Express.js REST APIs, Mongoose ODM schemas, and MetaMask EIP-1193/191 providers."),
        ("Academic Technical Documentation Specialist", "Specialist in constructing UML diagrams, entity-relationship schemas, flowcharts, data flow models, and formal tabular comparisons.")
    ]
    for r_title, r_desc in roles:
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(3)
        run_bold = p.add_run(f"{r_title}: ")
        run_bold.font.bold = True
        run_bold.font.color.rgb = PRIMARY_COLOR
        p.add_run(r_desc)

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # --- SECTION: PROJECT ANALYSIS RULES ---
    add_custom_heading("3. PROJECT ANALYSIS RULES (GROUND TRUTH DIRECTIVES)", level=1)
    doc.add_paragraph(
        "Before generating any chapter or section of the final report, a rigorous and exhaustive audit of the project source code in the active workspace must be maintained as the sole source of truth."
    )

    p_box = doc.add_paragraph()
    p_box.paragraph_format.left_indent = Inches(0.2)
    p_box.paragraph_format.right_indent = Inches(0.2)
    p_box.paragraph_format.space_before = Pt(4)
    p_box.paragraph_format.space_after = Pt(4)
    r_box = p_box.add_run("MANDATORY RULE OF ABSOLUTE ACCURACY:\n"
                          "1. The project files available in the workspace (c:\\bct) are the only source of truth.\n"
                          "2. Never create imaginary features, phantom endpoints, or fictitious contract logic.\n"
                          "3. If a feature is not implemented in code, it MUST NOT be claimed as implemented.\n"
                          "4. Any unimplemented or partial capabilities must be candidly documented in Chapter 12 (Limitations) and Chapter 13 (Future Scope).\n"
                          "5. Do not generate fake or simulated screenshot images. Use standardized academic figure placeholders.")
    r_box.font.size = Pt(10)
    r_box.font.color.rgb = RGBColor(120, 30, 30)

    add_custom_heading("3.1 Mandatory Codebase Dimensions for Inspection", level=2)
    audit_dimensions = [
        "Frontend Architecture: React 18, Vite, Tailwind CSS, Ethers.js v6, Lucide React, Axios API interceptors.",
        "Backend Architecture: Node.js, Express REST API, JWT bearer authentication, Helmet, CORS, express-rate-limit, asynchronous audit logging.",
        "Database Design: MongoDB with Mongoose ODM (Users, Merchants, Coupons, Cashbacks, Transactions, Categories, Admin, WalletMappings, AuditLogs).",
        "API Structure: Clean modular routing across /api/auth, /api/merchants, /api/customers, /api/admin, and /api/analytics.",
        "Solidity Smart Contracts: CouponCashbackSystem.sol implementing CreateCoupon, ClaimCoupon, RedeemCoupon, VerifyCoupon, RecordCashback, and event emitters.",
        "Hardhat & Local EVM Setup: Hardhat configuration (Solidity 0.8.24, Chain ID 31337), deploy scripts, and contractDeployment.json export pipelines.",
        "MetaMask Integration: EIP-1193 provider connection, account change listeners, and EIP-191 personal sign challenge-response nonce verification.",
        "Blockchain Transaction Flow: End-to-end issuance, hash anchoring, wallet claiming, POS presentation verification, atomic redemption, and direct ETH escrow disbursement.",
        "User Roles & Access Control: Explicit privilege segmentation among Customer, Merchant, and System Administrator."
    ]
    for dim in audit_dimensions:
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(2)
        parts = dim.split(":", 1)
        r1 = p.add_run(parts[0] + ":")
        r1.font.bold = True
        r1.font.color.rgb = PRIMARY_COLOR
        p.add_run(parts[1])

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # --- SECTION: REFERENCE REPORT RULES ---
    add_custom_heading("4. REFERENCE REPORT UTILIZATION RULES", level=1)
    doc.add_paragraph(
        "A reference report document (Raw Material Traceability System) is provided strictly as an academic template benchmark. The following boundary conditions must be respected without exception:"
    )

    table_ref = doc.add_table(rows=1, cols=2)
    table_ref.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr = table_ref.rows[0]
    hdr.cells[0].paragraphs[0].add_run("PERMITTED REFERENCE ADAPTATIONS").font.bold = True
    hdr.cells[1].paragraphs[0].add_run("STRICTLY PROHIBITED COPYING (NO PLAGIARISM)").font.bold = True
    set_cell_background(hdr.cells[0], "0E387A")
    set_cell_background(hdr.cells[1], "7A0E0E")
    hdr.cells[0].paragraphs[0].runs[0].font.color.rgb = RGBColor(255, 255, 255)
    hdr.cells[1].paragraphs[0].runs[0].font.color.rgb = RGBColor(255, 255, 255)

    ref_data = [
        ("• Chapter sequence & layout structure\n• Formatting styles and margin hierarchies\n• Heading levels (1, 2, 3) and styling\n• Standardized table borders and headers\n• Figure numbering and caption schema\n• Formal university thesis writing tone\n• Comprehensive depth of technical explanation",
         "• Do NOT copy title, student details, or guide\n• Do NOT copy abstract, problem statement, or objectives\n• Do NOT copy literature review or citations\n• Do NOT copy supply chain raw material domains\n• Do NOT reuse traceability diagrams or code\n• Do NOT reuse tables, metrics, or evaluations\n• All content must be 100% original for BlockCoupon")
    ]
    for left_txt, right_txt in ref_data:
        r = table_ref.add_row()
        r.cells[0].paragraphs[0].text = left_txt
        r.cells[1].paragraphs[0].text = right_txt
        set_cell_background(r.cells[0], "F4F6F9")
        set_cell_background(r.cells[1], "FFF5F5")
        set_cell_margins(r.cells[0], top=100, bottom=100, left=150, right=150)
        set_cell_margins(r.cells[1], top=100, bottom=100, left=150, right=150)

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # --- SECTION: REPORT STRUCTURE & CHAPTER BREAKDOWN ---
    add_custom_heading("5. COMPREHENSIVE REPORT CHAPTER SPECIFICATION", level=1)
    doc.add_paragraph(
        "The project report must be systematically constructed following university B.Tech guidelines, containing the following complete sequence of components:"
    )

    chapters = [
        ("Preliminary Pages", [
            "Cover Page: Formal university title block, candidate details, supervisor, department, and institution.",
            "Certificate: Official institutional certificate of bona fide work signed by Guide and Head of Department.",
            "Declaration: Candidate's formal academic integrity declaration.",
            "Acknowledgement: Formal institutional, faculty, lab technician, and parental acknowledgements.",
            "Abstract: Comprehensive executive summary of problem, hybrid Web3 methodology, and empirical findings.",
            "Table of Contents: Complete hierarchy with accurate page index references.",
            "List of Figures & List of Tables: Complete index of diagrams, charts, schemas, and comparison matrices.",
            "Abbreviations: Comprehensive glossary of technical acronyms (EVM, EIP, JWT, POS, etc.)."
        ]),
        ("Chapter 1: Introduction", [
            "1.1 Blockchain Background & Evolution (Distributed ledgers, Ethereum EVM, smart contracts).",
            "1.2 Digital Promotional Coupon & Cashback Vulnerabilities.",
            "1.3 Existing Centralized Promotional Systems.",
            "1.4 Critical Limitations of Existing Systems (Double redemption, tampering, opaque cashbacks).",
            "1.5 Proposed System Architecture (BlockCoupon Hybrid Web3 Engine).",
            "1.6 Research & Engineering Objectives.",
            "1.7 Key Technological Advantages.",
            "1.8 Real-World Commercial Applications.",
            "1.9 Project Scope & Operational Boundaries."
        ]),
        ("Chapter 2: Literature Survey", [
            "2.1 Related Research Papers in Blockchain, Smart Contracts, Loyalty, and Escrow Systems.",
            "2.2 Formal Comparative Analysis Table (Centralized vs. Pure On-Chain vs. BlockCoupon Hybrid).",
            "2.3 Research Gaps Addressed by BlockCoupon."
        ]),
        ("Chapter 3: Requirement Analysis", [
            "3.1 Detailed Functional Requirements Specification (FR-01 to FR-13 across all user roles).",
            "3.2 Non-Functional Requirements (Security, Integrity, Performance, Usability, Reliability).",
            "3.3 Hardware Requirements (Development, server, and client deployment environments).",
            "3.4 Software Requirements (Languages, compilers, frameworks, libraries, database engines).",
            "3.5 Technical, Operational, and Economic Feasibility Analysis."
        ]),
        ("Chapter 4: System Design", [
            "4.1 High-Level Multi-Tier System Architecture (Mermaid flowchart TD).",
            "4.2 Unified UML Use Case Diagram (Mermaid flowchart TD).",
            "4.3 Data Flow Diagrams: Context Level 0 DFD and Detailed Modular Level 1 DFD.",
            "4.4 UML Sequence Diagram: End-to-end Claim, POS Verification, and Cashback Disbursement.",
            "4.5 UML Activity Diagram: Dynamic State Transitions and Conditional Fraud Security Gates.",
            "4.6 Domain Class Diagram (Mermaid classDiagram).",
            "4.7 Entity-Relationship (ER) Database Diagram (Mermaid erDiagram).",
            "4.8 Physical Multi-Tier Deployment Topology Diagram."
        ]),
        ("Chapter 5: Implementation Details", [
            "5.1 Frontend Web3 Implementation (React components, Tailwind design system, context providers).",
            "5.2 Backend API Implementation (Express architecture, controller logic, middleware pipelines).",
            "5.3 Database Implementation (Mongoose schemas, indexing strategies, audit logging).",
            "5.4 Blockchain & EVM Implementation (Solidity 0.8.24 contract compilation and Hardhat scripts).",
            "5.5 Smart Contract Integration (Ethers.js v6 JSON-RPC provider, signer abstraction, and event hooks).",
            "5.6 MetaMask Cryptographic Signature Integration (EIP-191 personal sign challenge-response).",
            "5.7 End-to-End API Execution Workflow."
        ]),
        ("Chapter 6: Smart Contract Formal Explanation", [
            "Exhaustive explanation of every Solidity function in CouponCashbackSystem.sol:",
            "• Purpose and algorithmic rationale",
            "• Input parameters and data types",
            "• Return values and state transitions",
            "• Internal computational workflow",
            "• Events emitted (CouponCreated, CouponClaimed, CouponRedeemed, CashbackIssued)",
            "• Security checks and modifiers (onlyAdmin, onlyAuthorizedMerchant, nonReentrant, whenNotPaused)"
        ]),
        ("Chapter 7: Database Design & Schemas", [
            "Detailed schema specifications for all 9 collections (Users, Merchants, Coupons, Cashbacks, Transactions, Categories, Admin, WalletMappings, AuditLogs) with field types, constraints, and indexes."
        ]),
        ("Chapter 8: User Interface & Component Walkthrough", [
            "Complete UI analysis for every implemented page (Landing, Login, Register, Dashboards, Marketplace, Details, Vault, Cashback Ledger, POS Verifier, Analytics, Settings) with figure placeholders and functional walkthroughs."
        ]),
        ("Chapter 9: Testing & Verification", [
            "9.1 Testing Strategy (Unit, Integration, and System Level testing).",
            "9.2 Automated Smart Contract Unit Testing (15 Mocha/Chai test cases with expected vs. actual outcomes).",
            "9.3 REST API Integration Testing.",
            "9.4 Security & Edge Case Validation (Double-redemption attacks, hash tampering, expired claims)."
        ]),
        ("Chapter 10: Security & Anti-Fraud Analysis", [
            "10.1 Authentication & Authorization Security (bcrypt, JWT, EIP-191 signature replay protection).",
            "10.2 Cryptographic Hash Anchoring & Tamper Detection.",
            "10.3 Smart Contract Security (ReentrancyGuard, Checks-Effects-Interactions, circuit breaker).",
            "10.4 API Security (Helmet, CORS whitelisting, Rate Limiting, Asynchronous Audit Logging)."
        ]),
        ("Chapter 11: Experimental Results & Performance", [
            "System execution outcomes, transaction gas consumption, API response latency, and comparative benchmarks."
        ]),
        ("Chapter 12: Limitations", [
            "Strictly factual documentation of current prototype limitations (local EVM network, manual POS input, static voucher denominations)."
        ]),
        ("Chapter 13: Future Scope", [
            "Realistic engineering advancements: ERC-4337 Account Abstraction, Layer-2 rollups, Dynamic NFT vouchers, physical barcode hardware integration."
        ]),
        ("Chapter 14: Conclusion", [
            "Summary of engineering achievements and concluding remarks on blockchain utility in digital commerce."
        ]),
        ("References & Appendix", [
            "References: IEEE formatted academic bibliography.",
            "Appendix: Key code listings, API endpoints, environment variables, and deployment instructions."
        ])
    ]

    for title, items in chapters:
        add_custom_heading(title, level=2)
        for it in items:
            p = doc.add_paragraph(style='List Bullet')
            p.paragraph_format.space_after = Pt(2)
            p.add_run(it)

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # --- SECTION: WRITING STYLE & FORMATTING RULES ---
    add_custom_heading("6. ACADEMIC WRITING STYLE & FORMATTING RULES", level=1)
    style_rules = [
        ("Formal University Tone", "Use objective, passive, and professional academic English suitable for a Bachelor of Technology engineering thesis. Avoid informal language, marketing hyperbole, or conversational AI syntax."),
        ("Concept Precedence", "Explain foundational computer science and cryptographic concepts (e.g., Keccak-256, EVM storage slots, Checks-Effects-Interactions) prior to detailing code implementations."),
        ("Consistent Nomenclature", "Maintain strict technical naming across all chapters (e.g., 'CouponCashbackSystem.sol', 'CouponCreated', 'RedeemCoupon', 'Ethers.js v6', 'MongoDB Community Server')."),
        ("Standardized Captions", "Every figure must include 'Figure X.Y: Caption' below the diagram. Every table must include 'Table X.Y: Title' above the table."),
        ("Screenshot Policy", "Do not create fake screenshots. Use standardized visual placeholder blocks with clear dimensional specifications [Screenshot Placeholder: Figure 8.X - Caption]."),
        ("Diagram Specifications", "Provide clean, syntactically valid Mermaid.js diagrams for all architectural, behavioural, and structural system models.")
    ]
    for st_title, st_desc in style_rules:
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(3)
        r = p.add_run(f"{st_title}: ")
        r.font.bold = True
        r.font.color.rgb = PRIMARY_COLOR
        p.add_run(st_desc)

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # --- SECTION: OUTPUT PROCESS ---
    add_custom_heading("7. REPORT GENERATION EXECUTION PROCESS", level=1)
    doc.add_paragraph(
        "To ensure complete academic depth, precision, and prevent context truncation, the report authoring workflow must strictly follow this two-stage pipeline:"
    )

    p_st1 = doc.add_paragraph()
    p_st1.add_run("Stage 1: Preliminary Analysis & Foundation Verification (Pre-requisite)\n").font.bold = True
    p_st1.add_run(
        "Prior to writing chapters, deliver:\n"
        "1. Complete project architecture summary\n"
        "2. Comprehensive list of implemented modules\n"
        "3. Technology stack breakdown\n"
        "4. Exact smart contract functions and events identified\n"
        "5. Database collections identified\n"
        "6. Actual implementation limitations identified"
    )

    p_st2 = doc.add_paragraph()
    p_st2.add_run("Stage 2: Segmented Chapter-by-Chapter Authoring\n").font.bold = True
    p_st2.add_run(
        "Upon review, generate the report chapter by chapter in complete, exhaustive technical detail matching university submission standards, maintaining persistent adherence to these instructions until Chapter 14, References, and Appendices are fully completed."
    )

    # Save document
    doc.save(filename)
    print(f"[SUCCESS] Instructions Word document created successfully at: {os.path.abspath(filename)}")

if __name__ == "__main__":
    create_instructions_doc()
