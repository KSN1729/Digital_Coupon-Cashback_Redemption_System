import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

def create_instructions_doc(output_path="BlockCoupon_Project_Report_Instructions.docx"):
    doc = docx.Document()

    # Set Margins (1.0 inch all sides)
    for s in doc.sections:
        s.top_margin = Inches(1.0)
        s.bottom_margin = Inches(1.0)
        s.left_margin = Inches(1.0)
        s.right_margin = Inches(1.0)

    # Color Palette
    PRIMARY = RGBColor(14, 56, 122)      # Deep Academic Navy
    SECONDARY = RGBColor(70, 80, 95)    # Slate Gray
    DARK = RGBColor(33, 37, 41)         # Charcoal Black

    normal = doc.styles['Normal']
    normal.font.name = 'Calibri'
    normal.font.size = Pt(11)
    normal.font.color.rgb = DARK
    normal.paragraph_format.line_spacing = 1.15
    normal.paragraph_format.space_after = Pt(4)

    def add_h(text, level):
        h = doc.add_heading(text, level=level)
        h.paragraph_format.keep_with_next = True
        r = h.runs[0]
        r.font.name = 'Calibri'
        if level == 1:
            r.font.size = Pt(16)
            r.font.bold = True
            r.font.color.rgb = PRIMARY
            h.paragraph_format.space_before = Pt(14)
            h.paragraph_format.space_after = Pt(6)
        elif level == 2:
            r.font.size = Pt(13)
            r.font.bold = True
            r.font.color.rgb = PRIMARY
            h.paragraph_format.space_before = Pt(10)
            h.paragraph_format.space_after = Pt(4)
        return h

    def set_bg(cell, hex_color):
        tcPr = cell._tc.get_or_add_tcPr()
        tcPr.append(parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>'))

    # Title
    p_title = doc.add_paragraph()
    r_t = p_title.add_run('MASTER INSTRUCTION SPECIFICATION')
    r_t.font.name = 'Calibri'
    r_t.font.size = Pt(22)
    r_t.font.bold = True
    r_t.font.color.rgb = PRIMARY
    p_title.paragraph_format.space_after = Pt(2)

    p_sub = doc.add_paragraph()
    r_s = p_sub.add_run('Directives for Authoring B.Tech Final Year Academic Project Report\nDepartment of Computer Science and Engineering')
    r_s.font.size = Pt(12)
    r_s.font.color.rgb = SECONDARY
    p_sub.paragraph_format.space_after = Pt(14)

    # 1. Project Details
    add_h('1. Project Details', level=1)
    tbl = doc.add_table(rows=4, cols=2)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    items = [
        ('Student Name', 'Kakarla Sankar Narayana'),
        ('Department', 'Computer Science and Engineering'),
        ('Project Title', 'BlockCoupon: Blockchain-Based Digital Coupon & Cashback Redemption System'),
        ('Project Type', 'B.Tech Final Year Project Report')
    ]
    for idx, (k, v) in enumerate(items):
        c1, c2 = tbl.rows[idx].cells[0], tbl.rows[idx].cells[1]
        c1.width = Inches(2.2)
        c2.width = Inches(4.3)
        r1 = c1.paragraphs[0].add_run(k)
        r1.font.bold = True
        r1.font.color.rgb = PRIMARY
        r2 = c2.paragraphs[0].add_run(v)
        if idx == 2:
            r2.font.bold = True
        set_bg(c1, 'EBF0F8')
        set_bg(c2, 'FFFFFF' if idx % 2 == 0 else 'F9FAFC')
    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # 2. AI Role Definition
    add_h('2. AI Role Definition', level=1)
    doc.add_paragraph('The AI model operates in the professional capacity of an interdisciplinary domain expert covering the following responsibilities:')
    roles = [
        ('Blockchain Architect', 'Designs hybrid on-chain/off-chain settlement models, consensus workflows, cryptographic commitments, and gas-efficient state machines.'),
        ('Solidity Developer', 'Constructs, evaluates, and documents EVM smart contracts, functions, modifiers, events, access control, and reentrancy protections.'),
        ('Full Stack Developer', 'Analyzes React frontend interfaces, Node.js/Express backend APIs, Ethers.js integration, MetaMask wallet connectivity, and MongoDB schemas.'),
        ('Academic Report Writer', 'Adheres strictly to university B.Tech report structures, academic grammar, formal technical prose, and standardized figure/table schemas.')
    ]
    for r_title, r_desc in roles:
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(2)
        r = p.add_run(r_title + ': ')
        r.font.bold = True
        r.font.color.rgb = PRIMARY
        p.add_run(r_desc)
    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # 3. Project Analysis Rules
    add_h('3. Project Analysis Rules', level=1)
    doc.add_paragraph('The project source code in the workspace (c:\\bct) is the ONLY source of truth. Every architectural claim and code explanation must reflect actual repository files.')
    doc.add_paragraph('Comprehensive analysis dimensions required:')
    dims = [
        'React frontend (Vite, Tailwind CSS, components, pages, context providers)',
        'Node.js backend & Express APIs (REST controllers, routes, middleware, error handlers)',
        'MongoDB database (9 Mongoose models, schemas, indexing, relationships)',
        'Solidity smart contracts (CouponCashbackSystem.sol, logic, modifiers, events)',
        'Hardhat & Ganache setup (EVM configuration, chain ID 31337, compilation, deployment scripts)',
        'MetaMask & Ethers.js (EIP-1193 provider connection, EIP-191 personal sign challenge-response)',
        'Blockchain transaction flow (issuance, hash anchoring, claiming, POS verification, redemption, cashback payout)',
        'User roles (Customer, Merchant, Administrator privilege matrix)',
        'Coupon workflow (creation, deterministic hashing, claiming, presentation, verification, redemption)',
        'Cashback workflow (escrow funding, atomic state transition, direct ETH disbursement)'
    ]
    for d in dims:
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(2)
        p.add_run(d)

    p_alert = doc.add_paragraph()
    p_alert.paragraph_format.space_before = Pt(4)
    r_a = p_alert.add_run('STRICT GROUND TRUTH DIRECTIVE:\nNever invent features. If any feature is missing or partially implemented, it must NOT be portrayed as functional in the implementation chapters; it must appear strictly in Limitations or Future Scope.')
    r_a.font.bold = True
    r_a.font.color.rgb = RGBColor(160, 20, 20)
    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # 4. Reference Report Rules
    add_h('4. Reference Report Rules', level=1)
    doc.add_paragraph('A reference report template is provided solely as a benchmark for layout conventions.')
    t_ref = doc.add_table(rows=1, cols=2)
    t_ref.alignment = WD_TABLE_ALIGNMENT.CENTER
    h_c1, h_c2 = t_ref.rows[0].cells[0], t_ref.rows[0].cells[1]
    h_c1.paragraphs[0].add_run('PERMITTED FOR (BENCHMARK ONLY)').font.bold = True
    h_c2.paragraphs[0].add_run('NEVER COPY (STRICTLY PROHIBITED)').font.bold = True
    set_bg(h_c1, '0E387A')
    set_bg(h_c2, '7A0E0E')
    h_c1.paragraphs[0].runs[0].font.color.rgb = RGBColor(255, 255, 255)
    h_c2.paragraphs[0].runs[0].font.color.rgb = RGBColor(255, 255, 255)
    r_row = t_ref.add_row()
    r_row.cells[0].paragraphs[0].text = '• Formatting and margin layout\n• Chapter hierarchy and sequence\n• Heading levels and typography\n• Table border formatting\n• Figure numbering and caption styles\n• Academic writing depth and rigor'
    r_row.cells[1].paragraphs[0].text = '• Document content and wording\n• Title, candidate name, or supervisor\n• Diagrams and architecture figures\n• Screenshots or UI captures\n• Literature survey and papers\n• Bibliography and references\n(All content must be 100% original to BlockCoupon)'
    set_bg(r_row.cells[0], 'F4F6F9')
    set_bg(r_row.cells[1], 'FFF5F5')
    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # 5. Report Structure
    add_h('5. Report Structure', level=1)
    doc.add_paragraph('The generated B.Tech project report must include the complete formal chapter sequence:')
    struct = [
        ('Preliminary Pages', ['Cover Page', 'Certificate', 'Declaration', 'Acknowledgement', 'Abstract', 'Table of Contents', 'List of Figures', 'List of Tables']),
        ('Chapter 1: Introduction', ['Background (blockchain & cryptography)', 'Digital coupon problems & challenges', 'Existing system description', 'Existing system limitations', 'Proposed system (BlockCoupon)', 'Project objectives', 'Key advantages', 'Real-world applications', 'Scope & boundaries']),
        ('Chapter 2: Literature Survey', ['Related blockchain research papers', 'Smart contract research', 'Loyalty and coupon systems', 'Cashback & escrow systems', 'Comparative analysis table', 'Identified research gap']),
        ('Chapter 3: Requirement Analysis', ['Functional requirements (all 3 user roles)', 'Non-functional requirements (security, integrity, performance, reliability)', 'Hardware requirements', 'Software requirements', 'Feasibility analysis']),
        ('Chapter 4: System Design', ['System architecture diagram', 'Blockchain architecture diagram', 'Module descriptions', 'Use case diagram', 'Activity diagram', 'Sequence diagram', 'Class diagram', 'Entity-Relationship (ER) diagram', 'Deployment diagram', 'Data flow diagrams (Level 0 & Level 1)', 'Complete Mermaid code for all models']),
        ('Chapter 5: Implementation', ['Frontend implementation (React, Tailwind, Contexts)', 'Backend implementation (Express, MVC, Middleware)', 'Database implementation (Mongoose models, indexing)', 'Blockchain implementation (Solidity, Hardhat)', 'Smart contract integration (Ethers.js provider/signer)', 'Wallet connection (MetaMask, EIP-191)', 'API workflow']),
        ('Chapter 6: Smart Contract Explanation', ['Detailed analysis of actual Solidity code (CouponCashbackSystem.sol)', 'Contract purpose & data structures', 'Every function explained (inputs, outputs, workflow, events, modifiers, security checks)']),
        ('Chapter 7: Database Design', ['Collections, schemas, fields, types, relationships, sample documents, indexes for all 9 collections']),
        ('Chapter 8: User Interface', ['Every implemented page (Landing, Login, Register, Dashboards, Marketplace, Vault, POS Verifier, Analytics, Settings)', 'Purpose, functionality, and standardized screenshot placeholder blocks']),
        ('Chapter 9: Testing', ['Unit testing, integration testing, system testing, 15 Hardhat contract unit test cases (expected vs actual)']),
        ('Chapter 10: Security Analysis', ['Authentication, authorization, blockchain security, coupon validation, double-redemption prevention, smart contract security, event logging']),
        ('Chapter 11: Results', ['System outputs, performance discussion, gas consumption, advantages, comparison with existing systems']),
        ('Chapter 12: Limitations', ['Strictly actual limitations found in the codebase']),
        ('Chapter 13: Future Scope', ['Realistic engineering advancements (ERC-4337, L2 rollups, Dynamic NFTs, hardware barcode scanners)']),
        ('Chapter 14: Conclusion', ['Summary of achievements and final concluding remarks']),
        ('References', ['IEEE-compliant academic references']),
        ('Appendix', ['Code listings, API endpoint specifications, contract ABI, deployment steps'])
    ]
    for cat, subitems in struct:
        add_h(cat, level=2)
        for s in subitems:
            p = doc.add_paragraph(style='List Bullet')
            p.paragraph_format.space_after = Pt(1.5)
            p.add_run(s)
    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # 6. Writing Rules
    add_h('6. Writing Rules', level=1)
    rules = [
        'Use formal academic English suitable for a university engineering thesis.',
        'Avoid conversational, promotional, or generic AI-style writing.',
        'Explain theoretical and cryptographic concepts before presenting implementation specifics.',
        'Include comparative tables and formal data schemas.',
        'Include standardized figure and table numbering throughout all chapters.',
        'Provide valid Mermaid syntax for all visual architectures and diagrams.',
        'Never create fake or simulated screenshots; utilize standardized academic placeholder blocks.',
        'Maintain consistent university project report style and terminology.'
    ]
    for r in rules:
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(2)
        p.add_run(r)
    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # 7. Output Workflow
    add_h('7. Output Workflow', level=1)
    doc.add_paragraph('To ensure maximum technical depth and prevent context truncation, execution proceeds in two defined phases:')
    wf = [
        'Phase 1: Project Analysis Summary — Present Architecture, Implemented Modules, Technology Stack, Smart Contracts, Database Collections, and Actual Limitations.',
        'Phase 2: Chapter-by-Chapter Report Generation — Generate the full report systematically chapter by chapter upon confirmation.'
    ]
    for w in wf:
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(2)
        p.add_run(w)

    doc.save(output_path)
    print(f"File created successfully at {output_path}")

if __name__ == "__main__":
    create_instructions_doc()
